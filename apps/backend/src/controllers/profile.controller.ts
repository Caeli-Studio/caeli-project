import { hashPin, isValidPseudo } from '../utils/helpers';
import type {
  CreateProfileRequest,
  ProfileResponse,
  UpdateProfileRequest,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

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

    const { data: memberships } = await request.supabaseClient
      .from('memberships')
      .select(`
        *,
        group:groups(*)
      `)
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    const response: ProfileResponse = {
      ...profile,
      memberships: memberships || [],
    };

    return reply.send({
      success: true,
      profile: {
        ...response,
        email: request.user.email,
      },
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

    const { data: memberships } = await request.supabaseClient
      .from('memberships')
      .select(`
        *,
        group:groups(*)
      `)
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    return reply.send({
      success: true,
      profile: {
        ...profile,
        memberships: memberships || [],
        email: request.user.email,
      },
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
        error: 'No file provided',
      });
    }

    const fileBuffer = await file.toBuffer();
    const filename = `avatars/${request.user.sub}-${Date.now()}.jpg`;

    const { error: uploadError } = await request.supabaseClient.storage
      .from('avatars')
      .upload(filename, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return reply.status(500).send({
        success: false,
        error: 'Failed to upload avatar',
      });
    }

    const { data: publicUrlData } = request.supabaseClient.storage
      .from('avatars')
      .getPublicUrl(filename);

    const avatar_url = publicUrlData.publicUrl;

    const { data: profile, error: updateError } = await request.supabaseClient
      .from('profiles')
      .update({ avatar_url })
      .eq('user_id', request.user.sub)
      .select()
      .single();

    if (updateError) {
      console.error(updateError);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update avatar URL',
      });
    }

    const { data: memberships } = await request.supabaseClient
      .from('memberships')
      .select(`
        *,
        group:groups(*)
      `)
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    return reply.send({
      success: true,
      profile: {
        ...profile,
        memberships: memberships || [],
        email: request.user.email,
      },
    });
  } catch (err) {
    console.error('Error in uploadAvatar:', err);
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}
