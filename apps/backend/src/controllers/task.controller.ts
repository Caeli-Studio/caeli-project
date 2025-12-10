import type {
  AssignTaskRequest,
  CompleteTaskRequest,
  CreateTaskRequest,
  TaskQueryParams,
  TaskResponse,
  UpdateTaskRequest,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Create a new task
 */
export async function createTask(
  request: FastifyRequest<{
    Params: { group_id: string };
    Body: CreateTaskRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const { data: task, error } = await request.supabaseClient
      .from('tasks')
      .insert({
        group_id: request.params.group_id,
        title: request.body.title,
        description: request.body.description,
        due_at: request.body.due_at,
        required_count: request.body.required_count || 1,
        is_free: request.body.is_free || false,
        template_id: request.body.template_id,
        created_by: request.membership?.id,
        status: 'open',
      })
      .select()
      .single();

    if (error || !task) {
      request.log.error(error, 'Failed to create task');
      return reply.status(400).send({
        success: false,
        error: 'Failed to create task',
        message: error?.message,
      });
    }

    // Assign to members if specified
    if (request.body.assigned_membership_ids && request.body.assigned_membership_ids.length > 0) {
      const assignments = request.body.assigned_membership_ids.map((membership_id) => ({
        task_id: task.id,
        membership_id,
      }));

      const { error: assignError } = await request.supabaseClient
        .from('task_assignments')
        .insert(assignments);

      if (assignError) {
        request.log.error(assignError, 'Failed to assign task');
      }

      // Send notifications
      for (const membership_id of request.body.assigned_membership_ids) {
        await request.supabaseClient.from('notifications').insert({
          membership_id,
          type: 'task_assigned',
          data: {
            task_id: task.id,
            task_title: task.title,
            assigned_by: request.membership?.id,
          },
        });
      }
    }

    return reply.status(201).send({
      success: true,
      task,
    });
  } catch (err) {
    request.log.error(err, 'Error in createTask');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get tasks for a group
 */
export async function getTasks(
  request: FastifyRequest<{
    Params: { group_id: string };
    Querystring: TaskQueryParams;
  }>,
  reply: FastifyReply
) {
  try {
    let query = request.supabaseClient
      .from('tasks')
      .select(
        `
        *,
        assignments:task_assignments(
          *,
          member:memberships(*)
        ),
        creator:memberships!tasks_created_by_fkey(*)
      `
      )
      .eq('group_id', request.params.group_id);

    // Apply filters
    if (request.query.status) {
      query = query.eq('status', request.query.status);
    }

    if (request.query.is_free !== undefined) {
      query = query.eq('is_free', request.query.is_free);
    }

    if (request.query.from) {
      query = query.gte('due_at', request.query.from);
    }

    if (request.query.to) {
      query = query.lte('due_at', request.query.to);
    }

    if (request.query.assigned_to_me) {
      // This requires a join, let's handle it differently
      const { data: myAssignments } = await request.supabaseClient
        .from('task_assignments')
        .select('task_id')
        .eq('membership_id', request.membership?.id || '')
        .is('completed_at', null);

      if (myAssignments && myAssignments.length > 0) {
        const taskIds = myAssignments.map((a) => a.task_id);
        query = query.in('id', taskIds);
      } else {
        // No tasks assigned to me
        return reply.send({
          success: true,
          tasks: [],
          total: 0,
        });
      }
    }

    // Pagination
    const limit = request.query.limit || 50;
    const offset = request.query.offset || 0;

    query = query
      .order('due_at', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: tasks, error, count } = await query;

    if (error) {
      request.log.error(error, 'Failed to fetch tasks');
      return reply.status(400).send({
        success: false,
        error: 'Failed to fetch tasks',
        message: error.message,
      });
    }

    // Get all unique user_ids from memberships to fetch profiles
    const userIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tasks || []).forEach((task: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      task.assignments?.forEach((a: any) => {
        if (a.member?.user_id) userIds.add(a.member.user_id);
      });
      if (task.creator?.user_id) userIds.add(task.creator.user_id);
    });

    // Fetch profiles for all users
    const { data: profiles } = await request.supabaseClient
      .from('profiles')
      .select('*')
      .in('user_id', Array.from(userIds));

    const profileMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    // Enrich tasks with profiles and permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedTasks: TaskResponse[] = (tasks || []).map((task: any) => ({
      ...task,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignments: task.assignments?.map((a: any) => ({
        ...a,
        member: a.member
          ? {
              ...a.member,
              profile: profileMap.get(a.member.user_id),
            }
          : undefined,
      })),
      creator: task.creator
        ? {
            ...task.creator,
            profile: profileMap.get(task.creator.user_id),
          }
        : undefined,
      can_complete: task.assignments?.some(
        (a: { membership_id: string }) =>
          a.membership_id === request.membership?.id
      ),
      can_transfer: task.assignments?.some(
        (a: { membership_id: string }) =>
          a.membership_id === request.membership?.id
      ),
    }));

    return reply.send({
      success: true,
      tasks: enrichedTasks,
      total: count || tasks?.length || 0,
    });
  } catch (err) {
    request.log.error(err, 'Error in getTasks');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get a specific task
 */
export async function getTask(
  request: FastifyRequest<{ Params: { group_id: string; task_id: string } }>,
  reply: FastifyReply
) {
  try {
    const { data: task, error } = await request.supabaseClient
      .from('tasks')
      .select(
        `
        *,
        assignments:task_assignments(
          *,
          member:memberships(*)
        ),
        creator:memberships!tasks_created_by_fkey(*)
      `
      )
      .eq('id', request.params.task_id)
      .eq('group_id', request.params.group_id)
      .single();

    if (error || !task) {
      return reply.status(404).send({
        success: false,
        error: 'Task not found',
      });
    }

    // Get all unique user_ids from memberships to fetch profiles
    const userIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task.assignments?.forEach((a: any) => {
      if (a.member?.user_id) userIds.add(a.member.user_id);
    });
    if (task.creator?.user_id) userIds.add(task.creator.user_id);

    // Fetch profiles for all users
    const { data: profiles } = await request.supabaseClient
      .from('profiles')
      .select('*')
      .in('user_id', Array.from(userIds));

    const profileMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    // Enrich task with profiles
    const enrichedTask = {
      ...task,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignments: task.assignments?.map((a: any) => ({
        ...a,
        member: a.member
          ? {
              ...a.member,
              profile: profileMap.get(a.member.user_id),
            }
          : undefined,
      })),
      creator: task.creator
        ? {
            ...task.creator,
            profile: profileMap.get(task.creator.user_id),
          }
        : undefined,
    };

    const response: TaskResponse = {
      ...enrichedTask,
      can_complete: task.assignments?.some(
        (a: { membership_id: string }) =>
          a.membership_id === request.membership?.id
      ),
      can_transfer: task.assignments?.some(
        (a: { membership_id: string }) =>
          a.membership_id === request.membership?.id
      ),
    };

    return reply.send({
      success: true,
      task: response,
    });
  } catch (err) {
    request.log.error(err, 'Error in getTask');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Update a task
 */
export async function updateTask(
  request: FastifyRequest<{
    Params: { group_id: string; task_id: string };
    Body: UpdateTaskRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const { data: task, error } = await request.supabaseClient
      .from('tasks')
      .update({
        title: request.body.title,
        description: request.body.description,
        due_at: request.body.due_at,
        required_count: request.body.required_count,
        is_free: request.body.is_free,
        status: request.body.status,
      })
      .eq('id', request.params.task_id)
      .eq('group_id', request.params.group_id)
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to update task');
      return reply.status(400).send({
        success: false,
        error: 'Failed to update task',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      task,
    });
  } catch (err) {
    request.log.error(err, 'Error in updateTask');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Delete a task
 */
export async function deleteTask(
  request: FastifyRequest<{ Params: { group_id: string; task_id: string } }>,
  reply: FastifyReply
) {
  try {
    const { error } = await request.supabaseClient
      .from('tasks')
      .delete()
      .eq('id', request.params.task_id)
      .eq('group_id', request.params.group_id);

    if (error) {
      request.log.error(error, 'Failed to delete task');
      return reply.status(400).send({
        success: false,
        error: 'Failed to delete task',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in deleteTask');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Assign task to members
 */
export async function assignTask(
  request: FastifyRequest<{
    Params: { group_id: string; task_id: string };
    Body: AssignTaskRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const assignments = request.body.membership_ids.map((membership_id) => ({
      task_id: request.params.task_id,
      membership_id,
    }));

    const { error } = await request.supabaseClient
      .from('task_assignments')
      .insert(assignments);

    if (error) {
      request.log.error(error, 'Failed to assign task');
      return reply.status(400).send({
        success: false,
        error: 'Failed to assign task',
        message: error.message,
      });
    }

    // Get task title for notifications
    const { data: task } = await request.supabaseClient
      .from('tasks')
      .select('title')
      .eq('id', request.params.task_id)
      .single();

    // Send notifications
    for (const membership_id of request.body.membership_ids) {
      await request.supabaseClient.from('notifications').insert({
        membership_id,
        type: 'task_assigned',
        data: {
          task_id: request.params.task_id,
          task_title: task?.title,
          assigned_by: request.membership?.id,
        },
      });
    }

    return reply.send({
      success: true,
      message: 'Task assigned successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in assignTask');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Complete a task
 */
export async function completeTask(
  request: FastifyRequest<{
    Params: { group_id: string; task_id: string };
    Body?: CompleteTaskRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const membershipId = request.body?.membership_id || request.membership?.id;

    if (!membershipId) {
      return reply.status(400).send({
        success: false,
        error: 'Membership ID is required',
      });
    }

    // Mark assignment as completed
    const { error: assignmentError } = await request.supabaseClient
      .from('task_assignments')
      .update({ completed_at: new Date().toISOString() })
      .eq('task_id', request.params.task_id)
      .eq('membership_id', membershipId)
      .is('completed_at', null);

    if (assignmentError) {
      request.log.error(assignmentError, 'Failed to complete task assignment');
      return reply.status(400).send({
        success: false,
        error: 'Failed to complete task',
        message: assignmentError.message,
      });
    }

    // Check if all assignments are completed
    const { data: assignments } = await request.supabaseClient
      .from('task_assignments')
      .select('completed_at')
      .eq('task_id', request.params.task_id);

    const allCompleted = assignments?.every((a) => a.completed_at !== null);

    // If all completed, mark task as done
    if (allCompleted) {
      await request.supabaseClient
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', request.params.task_id);
    }

    return reply.send({
      success: true,
      message: 'Task completed successfully',
      task_status: allCompleted ? 'done' : 'partially_completed',
    });
  } catch (err) {
    request.log.error(err, 'Error in completeTask');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Take a free task
 */
export async function takeTask(
  request: FastifyRequest<{ Params: { group_id: string; task_id: string } }>,
  reply: FastifyReply
) {
  try {
    // Verify task is free
    const { data: task } = await request.supabaseClient
      .from('tasks')
      .select('is_free, status')
      .eq('id', request.params.task_id)
      .single();

    if (!task?.is_free) {
      return reply.status(400).send({
        success: false,
        error: 'Task is not available',
        message: 'This task is not marked as free',
      });
    }

    if (task.status !== 'open') {
      return reply.status(400).send({
        success: false,
        error: 'Task is not available',
        message: 'This task is already completed or cancelled',
      });
    }

    // Assign to current user
    const { error } = await request.supabaseClient
      .from('task_assignments')
      .insert({
        task_id: request.params.task_id,
        membership_id: request.membership?.id,
      });

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        return reply.status(400).send({
          success: false,
          error: 'Already assigned',
          message: 'You have already taken this task',
        });
      }

      request.log.error(error, 'Failed to take task');
      return reply.status(400).send({
        success: false,
        error: 'Failed to take task',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Task taken successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in takeTask');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
