import { hashPin, isValidPseudo } from '../utils/helpers';
import { Buffer } from "node:buffer";

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
      return reply.status(404).send({
        success: false,
        error: 'Profile not found',
      });
    }

    // User memberships
    const { data: memberships } = await request.supabaseClient
      .from('memberships')
      .select(`*, group:groups(*)`)
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    return reply.send({
      success: true,
      profile: {
        ...profile,
        memberships: memberships || [],
      },
    });
  } catch (err) {
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
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
      return reply.status(400).send({
        success: false,
        error: 'Failed to update profile',
      });
    }

    return reply.send({
      success: true,
      profile,
    });
  } catch (err) {
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Get a specific user's profile
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
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Create profile after sign up
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
      return reply.status(400).send({
        success: false,
        error: 'Failed to create profile',
      });
    }

    return reply.status(201).send({
      success: true,
      profile,
    });
  } catch (err) {
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Upload + update avatar
 */
export async function updateAvatar(
  request: FastifyRequest<{ Body: { avatar_base64: string } }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const { avatar_base64 } = request.body;
    if (!avatar_base64) {
      return reply.status(400).send({
        success: false,
        error: "Missing avatar_base64",
      });
    }

    const userId = request.user.sub;
    const fileName = `avatars/${userId}-${Date.now()}.png`;

    const { error: uploadError } = await request.supabaseClient.storage
      .from("avatars")
      .upload(fileName, Buffer.from(avatar_base64, "base64"), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      return reply.status(500).send({
        success: false,
        error: "Failed to upload avatar",
      });
    }

    const { data: publicUrlData } = request.supabaseClient.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatar_url = publicUrlData.publicUrl;

    const { data: profile, error: updateError } = await request.supabaseClient
      .from("profiles")
      .update({ avatar_url })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      return reply.status(400).send({
        success: false,
        error: "Failed to update avatar_url",
      });
    }

    return reply.send({
      success: true,
      avatar_url,
      profile,
    });
  } catch (err) {
    return reply.status(500).send({
      success: false,
      error: "Internal server error",
    });
  }
}
