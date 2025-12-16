import type {
  CreateTransferRequest,
  TransferQueryParams,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Create a task transfer or exchange request
 */
export async function createTransfer(
  request: FastifyRequest<{
    Params: { group_id: string };
    Body: CreateTransferRequest;
  }>,
  reply: FastifyReply
) {
  try {
    // Verify the task belongs to the group
    const { data: task } = await request.supabaseClient
      .from('tasks')
      .select('id, status')
      .eq('id', request.body.task_id)
      .eq('group_id', request.params.group_id)
      .single();

    if (!task) {
      return reply.status(404).send({
        success: false,
        error: 'Task not found',
      });
    }

    if (task.status !== 'open') {
      return reply.status(400).send({
        success: false,
        error: 'Cannot transfer completed or cancelled task',
      });
    }

    // Verify user is assigned to the task
    const { data: assignment } = await request.supabaseClient
      .from('task_assignments')
      .select('id')
      .eq('task_id', request.body.task_id)
      .eq('membership_id', request.membership?.id || '')
      .is('completed_at', null)
      .single();

    if (!assignment) {
      return reply.status(403).send({
        success: false,
        error: 'You are not assigned to this task',
      });
    }

    // Create the transfer
    const { data: transfer, error } = await request.supabaseClient
      .from('task_transfers')
      .insert({
        group_id: request.params.group_id,
        task_id: request.body.task_id,
        from_membership_id: request.membership?.id,
        to_membership_id: request.body.to_membership_id,
        return_task_id: request.body.return_task_id,
        message: request.body.message,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to create transfer');
      return reply.status(400).send({
        success: false,
        error: 'Failed to create transfer',
        message: error.message,
      });
    }

    // Send notification to recipient if specified
    if (request.body.to_membership_id) {
      await request.supabaseClient.from('notifications').insert({
        membership_id: request.body.to_membership_id,
        type: 'transfer_request',
        data: {
          transfer_id: transfer.id,
          task_id: request.body.task_id,
          from_member: request.membership?.id,
          message: request.body.message,
        },
      });
    }

    return reply.status(201).send({
      success: true,
      transfer,
    });
  } catch (err) {
    request.log.error(err, 'Error in createTransfer');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get transfers for a group
 */
export async function getTransfers(
  request: FastifyRequest<{
    Params: { group_id: string };
    Querystring: TransferQueryParams;
  }>,
  reply: FastifyReply
) {
  try {
    let query = request.supabaseClient
      .from('task_transfers')
      .select(
        `
        *,
        task:tasks!task_transfers_task_id_fkey(*),
        from_member:memberships!task_transfers_from_membership_id_fkey(
          *,
          profile:profiles(*)
        ),
        to_member:memberships!task_transfers_to_membership_id_fkey(
          *,
          profile:profiles(*)
        ),
        return_task:tasks!task_transfers_return_task_id_fkey(*),
        resolver:memberships!task_transfers_resolved_by_fkey(
          *,
          profile:profiles(*)
        )
      `
      )
      .eq('group_id', request.params.group_id);

    // Apply filters
    if (request.query.status) {
      query = query.eq('status', request.query.status);
    }

    if (request.query.from_me) {
      query = query.eq('from_membership_id', request.membership?.id);
    }

    if (request.query.to_me) {
      query = query.eq('to_membership_id', request.membership?.id);
    }

    // Pagination
    const limit = request.query.limit || 50;
    const offset = request.query.offset || 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: transfers, error } = await query;

    if (error) {
      request.log.error(error, 'Failed to fetch transfers');
      return reply.status(400).send({
        success: false,
        error: 'Failed to fetch transfers',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      transfers: transfers || [],
      total: transfers?.length || 0,
    });
  } catch (err) {
    request.log.error(err, 'Error in getTransfers');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get a specific transfer
 */
export async function getTransfer(
  request: FastifyRequest<{
    Params: { group_id: string; transfer_id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { data: transfer, error } = await request.supabaseClient
      .from('task_transfers')
      .select(
        `
        *,
        task:tasks!task_transfers_task_id_fkey(*),
        from_member:memberships!task_transfers_from_membership_id_fkey(
          *,
          profile:profiles(*)
        ),
        to_member:memberships!task_transfers_to_membership_id_fkey(
          *,
          profile:profiles(*)
        ),
        return_task:tasks!task_transfers_return_task_id_fkey(*),
        resolver:memberships!task_transfers_resolved_by_fkey(
          *,
          profile:profiles(*)
        )
      `
      )
      .eq('id', request.params.transfer_id)
      .eq('group_id', request.params.group_id)
      .single();

    if (error || !transfer) {
      return reply.status(404).send({
        success: false,
        error: 'Transfer not found',
      });
    }

    return reply.send({
      success: true,
      transfer,
    });
  } catch (err) {
    request.log.error(err, 'Error in getTransfer');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Accept a transfer request
 */
export async function acceptTransfer(
  request: FastifyRequest<{
    Params: { group_id: string; transfer_id: string };
  }>,
  reply: FastifyReply
) {
  try {
    // Get the transfer
    const { data: transfer } = await request.supabaseClient
      .from('task_transfers')
      .select('*, task:tasks!task_transfers_task_id_fkey(*)')
      .eq('id', request.params.transfer_id)
      .eq('group_id', request.params.group_id)
      .single();

    if (!transfer) {
      return reply.status(404).send({
        success: false,
        error: 'Transfer not found',
      });
    }

    if (transfer.status !== 'pending') {
      return reply.status(400).send({
        success: false,
        error: 'Transfer already resolved',
        message: `This transfer has been ${transfer.status}`,
      });
    }

    // Verify user is the recipient
    if (
      transfer.to_membership_id &&
      transfer.to_membership_id !== request.membership?.id
    ) {
      return reply.status(403).send({
        success: false,
        error: 'You are not the recipient of this transfer',
      });
    }

    // Update transfer status
    const { error: updateError } = await request.supabaseClient
      .from('task_transfers')
      .update({
        status: 'accepted',
        resolved_at: new Date().toISOString(),
        resolved_by: request.membership?.id,
      })
      .eq('id', request.params.transfer_id);

    if (updateError) {
      request.log.error(updateError, 'Failed to accept transfer');
      return reply.status(400).send({
        success: false,
        error: 'Failed to accept transfer',
        message: updateError.message,
      });
    }

    // Remove old assignment
    await request.supabaseClient
      .from('task_assignments')
      .delete()
      .eq('task_id', transfer.task_id)
      .eq('membership_id', transfer.from_membership_id);

    // Create new assignment
    await request.supabaseClient.from('task_assignments').insert({
      task_id: transfer.task_id,
      membership_id: request.membership?.id,
    });

    // If there's a return task, transfer it
    if (transfer.return_task_id) {
      await request.supabaseClient
        .from('task_assignments')
        .delete()
        .eq('task_id', transfer.return_task_id)
        .eq('membership_id', request.membership?.id);

      await request.supabaseClient.from('task_assignments').insert({
        task_id: transfer.return_task_id,
        membership_id: transfer.from_membership_id,
      });
    }

    // Notify the requester
    await request.supabaseClient.from('notifications').insert({
      membership_id: transfer.from_membership_id,
      type: 'ping',
      data: {
        message: 'Your transfer request was accepted',
        transfer_id: transfer.id,
        task_id: transfer.task_id,
      },
    });

    return reply.send({
      success: true,
      message: 'Transfer accepted successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in acceptTransfer');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Refuse a transfer request
 */
export async function refuseTransfer(
  request: FastifyRequest<{
    Params: { group_id: string; transfer_id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { data: transfer } = await request.supabaseClient
      .from('task_transfers')
      .select('*')
      .eq('id', request.params.transfer_id)
      .eq('group_id', request.params.group_id)
      .single();

    if (!transfer) {
      return reply.status(404).send({
        success: false,
        error: 'Transfer not found',
      });
    }

    if (transfer.status !== 'pending') {
      return reply.status(400).send({
        success: false,
        error: 'Transfer already resolved',
      });
    }

    if (
      transfer.to_membership_id &&
      transfer.to_membership_id !== request.membership?.id
    ) {
      return reply.status(403).send({
        success: false,
        error: 'You are not the recipient of this transfer',
      });
    }

    const { error } = await request.supabaseClient
      .from('task_transfers')
      .update({
        status: 'refused',
        resolved_at: new Date().toISOString(),
        resolved_by: request.membership?.id,
      })
      .eq('id', request.params.transfer_id);

    if (error) {
      request.log.error(error, 'Failed to refuse transfer');
      return reply.status(400).send({
        success: false,
        error: 'Failed to refuse transfer',
        message: error.message,
      });
    }

    // Notify the requester
    await request.supabaseClient.from('notifications').insert({
      membership_id: transfer.from_membership_id,
      type: 'ping',
      data: {
        message: 'Your transfer request was refused',
        transfer_id: transfer.id,
      },
    });

    return reply.send({
      success: true,
      message: 'Transfer refused',
    });
  } catch (err) {
    request.log.error(err, 'Error in refuseTransfer');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Cancel a transfer request
 */
export async function cancelTransfer(
  request: FastifyRequest<{
    Params: { group_id: string; transfer_id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { data: transfer } = await request.supabaseClient
      .from('task_transfers')
      .select('*')
      .eq('id', request.params.transfer_id)
      .eq('group_id', request.params.group_id)
      .single();

    if (!transfer) {
      return reply.status(404).send({
        success: false,
        error: 'Transfer not found',
      });
    }

    if (transfer.status !== 'pending') {
      return reply.status(400).send({
        success: false,
        error: 'Transfer already resolved',
      });
    }

    if (transfer.from_membership_id !== request.membership?.id) {
      return reply.status(403).send({
        success: false,
        error: 'Only the requester can cancel this transfer',
      });
    }

    const { error } = await request.supabaseClient
      .from('task_transfers')
      .update({
        status: 'cancelled',
        resolved_at: new Date().toISOString(),
        resolved_by: request.membership?.id,
      })
      .eq('id', request.params.transfer_id);

    if (error) {
      request.log.error(error, 'Failed to cancel transfer');
      return reply.status(400).send({
        success: false,
        error: 'Failed to cancel transfer',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Transfer cancelled',
    });
  } catch (err) {
    request.log.error(err, 'Error in cancelTransfer');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
