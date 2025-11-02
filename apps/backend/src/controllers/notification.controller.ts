import type {
  MarkNotificationsReadRequest,
  NotificationQueryParams,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Get user's notifications
 */
export async function getNotifications(
  request: FastifyRequest<{ Querystring: NotificationQueryParams }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    // Get user's memberships
    const { data: memberships } = await request.supabaseClient
      .from('memberships')
      .select('id')
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    if (!memberships || memberships.length === 0) {
      return reply.send({
        success: true,
        notifications: [],
        total: 0,
      });
    }

    const membershipIds = memberships.map((m) => m.id);

    let query = request.supabaseClient
      .from('notifications')
      .select(
        `
        *,
        membership:memberships(
          *,
          profile:profiles(*),
          group:groups(*)
        )
      `
      )
      .in('membership_id', membershipIds);

    // Apply filters
    if (request.query.unread_only) {
      query = query.is('read_at', null);
    }

    if (request.query.type) {
      query = query.eq('type', request.query.type);
    }

    // Pagination
    const limit = request.query.limit || 50;
    const offset = request.query.offset || 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: notifications, error } = await query;

    if (error) {
      request.log.error(error, 'Failed to fetch notifications');
      return reply.status(400).send({
        success: false,
        error: 'Failed to fetch notifications',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      notifications: notifications || [],
      total: notifications?.length || 0,
    });
  } catch (err) {
    request.log.error(err, 'Error in getNotifications');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Mark notifications as read
 */
export async function markAsRead(
  request: FastifyRequest<{ Body: MarkNotificationsReadRequest }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    // Get user's memberships
    const { data: memberships } = await request.supabaseClient
      .from('memberships')
      .select('id')
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    if (!memberships || memberships.length === 0) {
      return reply.send({
        success: true,
        message: 'No notifications to mark',
      });
    }

    const membershipIds = memberships.map((m) => m.id);

    let query = request.supabaseClient
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('membership_id', membershipIds)
      .is('read_at', null);

    // If specific IDs provided, only mark those
    if (
      request.body.notification_ids &&
      request.body.notification_ids.length > 0
    ) {
      query = query.in('id', request.body.notification_ids);
    }

    const { error } = await query;

    if (error) {
      request.log.error(error, 'Failed to mark notifications as read');
      return reply.status(400).send({
        success: false,
        error: 'Failed to mark notifications as read',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (err) {
    request.log.error(err, 'Error in markAsRead');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  request: FastifyRequest<{ Params: { notification_id: string } }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    // Verify ownership
    const { data: notification } = await request.supabaseClient
      .from('notifications')
      .select(
        `
        *,
        membership:memberships(user_id)
      `
      )
      .eq('id', request.params.notification_id)
      .single();

    if (!notification) {
      return reply.status(404).send({
        success: false,
        error: 'Notification not found',
      });
    }

    if (notification.membership.user_id !== request.user.sub) {
      return reply.status(403).send({
        success: false,
        error: 'Not your notification',
      });
    }

    const { error } = await request.supabaseClient
      .from('notifications')
      .delete()
      .eq('id', request.params.notification_id);

    if (error) {
      request.log.error(error, 'Failed to delete notification');
      return reply.status(400).send({
        success: false,
        error: 'Failed to delete notification',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err) {
    request.log.error(err, 'Error in deleteNotification');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
