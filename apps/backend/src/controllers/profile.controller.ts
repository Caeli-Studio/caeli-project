import { hashPin, isValidPseudo } from '../utils/helpers';

import type {
  CreateProfileRequest,
  ProfileResponse,
  UpdateProfileRequest,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Get current user's profile
 */
export async function getMyProfile(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const { data: profile, error } = await request.supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', request.user.sub)
      .single();

    if (error) {
      request.log.error(error, 'Failed to fetch profile');
      return reply.status(404).send({
        success: false,
        error: 'Profile not found',
      });
    }

    // Get user's group memberships
    const { data: memberships } = await request.supabaseClient
      .from('memberships')
      .select(
        `
        *,
        group:groups(*)
      `
      )
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    const response: ProfileResponse = {
      ...profile,
      memberships: memberships || [],
    };

    return reply.send({
      success: true,
      profile: response,
    });
  } catch (err) {
    request.log.error(err, 'Error in getMyProfile');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(
  request: FastifyRequest<{ Body: UpdateProfileRequest }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const updateData: Record<string, string> = {};

    if (request.body.display_name) {
      updateData.display_name = request.body.display_name;
    }

    if (request.body.pseudo !== undefined) {
      if (request.body.pseudo && !isValidPseudo(request.body.pseudo)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid pseudo format',
          message: 'Pseudo must be 3-20 alphanumeric characters or underscores',
        });
      }
      updateData.pseudo = request.body.pseudo;
    }

    if (request.body.avatar_url !== undefined) {
      updateData.avatar_url = request.body.avatar_url;
    }

    if (request.body.locale) {
      updateData.locale = request.body.locale;
    }

    if (request.body.pin) {
      updateData.pin_hash = await hashPin(request.body.pin);
    }

    const { data: profile, error } = await request.supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('user_id', request.user.sub)
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to update profile');

      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('pseudo')) {
        return reply.status(400).send({
          success: false,
          error: 'Pseudo already taken',
          message: 'This pseudo is already in use by another user',
        });
      }

      return reply.status(400).send({
        success: false,
        error: 'Failed to update profile',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      profile,
    });
  } catch (err) {
    request.log.error(err, 'Error in updateMyProfile');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get a specific user's profile (public info only)
 */
export async function getUserProfile(
  request: FastifyRequest<{ Params: { user_id: string } }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const { data: profile, error } = await request.supabaseClient
      .from('profiles')
      .select('user_id, display_name, pseudo, avatar_url, locale, created_at')
      .eq('user_id', request.params.user_id)
      .single();

    if (error || !profile) {
      return reply.status(404).send({
        success: false,
        error: 'Profile not found',
      });
    }

    return reply.send({
      success: true,
      profile,
    });
  } catch (err) {
    request.log.error(err, 'Error in getUserProfile');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Create profile after sign up (called automatically via trigger or manually)
 */
export async function createProfile(
  request: FastifyRequest<{ Body: CreateProfileRequest }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const { data: existingProfile } = await request.supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', request.user.sub)
      .single();

    if (existingProfile) {
      return reply.status(400).send({
        success: false,
        error: 'Profile already exists',
      });
    }

    // Validate pseudo if provided
    if (request.body.pseudo && !isValidPseudo(request.body.pseudo)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid pseudo format',
        message: 'Pseudo must be 3-20 alphanumeric characters or underscores',
      });
    }

    const { data: profile, error } = await request.supabaseClient
      .from('profiles')
      .insert({
        user_id: request.user.sub,
        display_name: request.body.display_name,
        pseudo: request.body.pseudo,
        avatar_url: request.body.avatar_url,
        locale: request.body.locale || 'en',
      })
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to create profile');

      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('pseudo')) {
        return reply.status(400).send({
          success: false,
          error: 'Pseudo already taken',
          message: 'This pseudo is already in use by another user',
        });
      }

      return reply.status(400).send({
        success: false,
        error: 'Failed to create profile',
        message: error.message,
      });
    }

    return reply.status(201).send({
      success: true,
      profile,
    });
  } catch (err) {
    request.log.error(err, 'Error in createProfile');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

export async function uploadAvatar(request, reply) {
  try {
    await request.jwtVerify();

    const file = await request.file();

    if (!file) {
      return reply.status(400).send({
        success: false,
        error: "No file provided",
      });
    }

    const fileBuffer = await file.toBuffer();

    // Nom du fichier : avatars/{userId}.jpg
    const filename = `avatars/${request.user.sub}-${Date.now()}.jpg`;

    // Upload dans Supabase Storage
    const { data, error: uploadError } = await request.supabaseClient.storage
      .from("avatars")
      .upload(filename, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return reply.status(500).send({
        success: false,
        error: "Failed to upload avatar",
      });
    }

    // Récupérer l’URL publique
    const { data: publicUrlData } = request.supabaseClient.storage
      .from("avatars")
      .getPublicUrl(filename);

    const avatar_url = publicUrlData.publicUrl;

    // Update profile DB
    const { data: profile, error: updateError } =
      await request.supabaseClient
        .from("profiles")
        .update({ avatar_url })
        .eq("user_id", request.user.sub)
        .select()
        .single();

    if (updateError) {
      console.error(updateError);
      return reply.status(500).send({
        success: false,
        error: "Failed to update avatar URL",
      });
    }

    return reply.send({
      success: true,
      profile,
    });

  } catch (err) {
    console.error("Error in uploadAvatar:", err);
    return reply.status(500).send({
      success: false,
      error: "Internal server error",
    });
  }
}

