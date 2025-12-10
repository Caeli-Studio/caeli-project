import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Authentication Controller
 * Handles Google OAuth authentication
 */

interface SignInWithGoogleBody {
  redirectUrl?: string;
}

interface CallbackQuery {
  code?: string;
  error?: string;
  error_description?: string;
}

/**
 * Initiate Google OAuth sign-in
 * Returns the OAuth URL for the client to redirect to
 */
export async function signInWithGoogle(
  request: FastifyRequest<{ Body: SignInWithGoogleBody }>,
  reply: FastifyReply
) {
  try {
    const { redirectUrl } = request.body;

    // Log the redirect URL being used
    const finalRedirectUrl =
      redirectUrl ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`;

    request.log.info(
      { redirectUrl, finalRedirectUrl },
      'Initiating Google OAuth'
    );

    // Get the OAuth URL from Supabase
    const { data, error } =
      await request.server.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

    if (error) {
      request.log.error(error, 'Google OAuth initiation failed');
      return reply.status(400).send({
        success: false,
        error: 'Failed to initiate Google sign-in',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      url: data.url,
      provider: data.provider,
    });
  } catch (err) {
    request.log.error(err, 'Error in signInWithGoogle');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Handle OAuth callback from Google
 * Exchanges the authorization code for a session
 */
export async function handleOAuthCallback(
  request: FastifyRequest<{ Querystring: CallbackQuery }>,
  reply: FastifyReply
) {
  try {
    const { code, error, error_description } = request.query;

    // Check for errors from OAuth provider
    if (error) {
      request.log.error({ error, error_description }, 'OAuth callback error');
      return reply.status(400).send({
        success: false,
        error,
        message: error_description || 'OAuth authentication failed',
      });
    }

    if (!code) {
      return reply.status(400).send({
        success: false,
        error: 'Missing authorization code',
        message: 'No authorization code provided',
      });
    }

    // Exchange the code for a session
    const { data, error: exchangeError } =
      await request.server.supabaseClient.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      request.log.error(exchangeError, 'Failed to exchange code for session');
      return reply.status(400).send({
        success: false,
        error: 'Failed to exchange authorization code',
        message: exchangeError.message,
      });
    }

    return reply.send({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        name:
          data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar:
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture,
        provider: data.user.app_metadata.provider,
      },
    });
  } catch (err) {
    request.log.error(err, 'Error in handleOAuthCallback');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Sign out the current user
 */
export async function signOut(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get the access token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'No access token provided',
        message: 'Authorization header is required',
      });
    }

    const token = authHeader.substring(7);

    // Sign out using the service role client
    const { error } =
      await request.server.supabaseClient.auth.admin.signOut(token);

    if (error) {
      request.log.error(error, 'Sign out failed');
      return reply.status(400).send({
        success: false,
        error: 'Failed to sign out',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Successfully signed out',
    });
  } catch (err) {
    request.log.error(err, 'Error in signOut');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get current user session
 */
export async function getSession(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify JWT and get user
    await request.jwtVerify();

    // Get user details from Supabase
    const { data, error } = await request.supabaseClient.auth.getUser();

    if (error) {
      request.log.error(error, 'Failed to get user');
      return reply.status(401).send({
        success: false,
        error: 'Failed to get user session',
        message: error.message,
      });
    }

    // Ensure user profile exists
    const { data: existingProfile } = await request.supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', data.user.id)
      .single();

    if (!existingProfile) {
      request.log.info(`Creating missing profile for user ${data.user.id}`);

      const { error: profileError } = await request.supabaseClient
        .from('profiles')
        .insert({
          user_id: data.user.id,
          display_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email ||
            'User',
          avatar_url:
            data.user.user_metadata?.avatar_url ||
            data.user.user_metadata?.picture,
        });

      if (profileError) {
        request.log.error({ error: profileError }, 'Failed to create profile');
        return reply.status(500).send({
          success: false,
          error: 'Failed to create user profile',
          message: profileError.message,
        });
      }
    }

    return reply.send({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name:
          data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar:
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture,
        provider: data.user.app_metadata.provider,
        created_at: data.user.created_at,
      },
    });
  } catch (err) {
    request.log.error(err, 'Error in getSession');
    return reply.status(401).send({
      success: false,
      error: 'Invalid or expired session',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Refresh user session/token
 */
export async function refreshSession(
  request: FastifyRequest<{ Body: { refresh_token: string } }>,
  reply: FastifyReply
) {
  try {
    const { refresh_token } = request.body;

    if (!refresh_token) {
      return reply.status(400).send({
        success: false,
        error: 'Missing refresh token',
        message: 'Refresh token is required',
      });
    }

    // Refresh the session
    const { data, error } =
      await request.server.supabaseClient.auth.refreshSession({
        refresh_token,
      });

    if (error) {
      request.log.error(error, 'Session refresh failed');
      return reply.status(401).send({
        success: false,
        error: 'Failed to refresh session',
        message: error.message,
      });
    }

    // Ensure user profile exists
    const { data: existingProfile } = await request.server.supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', data.user?.id)
      .single();

    if (!existingProfile && data.user?.id) {
      request.log.info(`Creating missing profile for user ${data.user.id}`);

      const { error: profileError } = await request.server.supabaseClient
        .from('profiles')
        .insert({
          user_id: data.user.id,
          display_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email ||
            'User',
          avatar_url:
            data.user.user_metadata?.avatar_url ||
            data.user.user_metadata?.picture,
        });

      if (profileError) {
        request.log.error({ error: profileError }, 'Failed to create profile');
        return reply.status(500).send({
          success: false,
          error: 'Failed to create user profile',
          message: profileError.message,
        });
      }
    }

    return reply.send({
      success: true,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
        token_type: data.session?.token_type,
      },
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name:
          data.user?.user_metadata?.full_name || data.user?.user_metadata?.name,
        avatar:
          data.user?.user_metadata?.avatar_url ||
          data.user?.user_metadata?.picture,
      },
    });
  } catch (err) {
    request.log.error(err, 'Error in refreshSession');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
