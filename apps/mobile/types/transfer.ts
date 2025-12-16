/**
 * Transfer types mirroring backend types
 */

import type { MembershipWithProfile, Task } from './task';

export type TransferStatus = 'pending' | 'accepted' | 'refused' | 'cancelled';

export interface TaskTransfer {
  id: string;
  group_id: string;
  task_id: string;
  from_membership_id: string;
  to_membership_id?: string;
  return_task_id?: string;
  status: TransferStatus;
  message?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface TransferWithDetails extends TaskTransfer {
  task: Task;
  from_member: MembershipWithProfile;
  to_member?: MembershipWithProfile;
  return_task?: Task;
  resolver?: MembershipWithProfile;
}

/**
 * Request/Response types
 */

export interface CreateTransferRequest {
  task_id: string;
  to_membership_id?: string;
  return_task_id?: string;
  message?: string;
}

export interface CreateTransferResponse {
  success: boolean;
  transfer: TaskTransfer;
}

export interface GetTransfersResponse {
  success: boolean;
  transfers: TransferWithDetails[];
  total: number;
}

export interface GetTransferResponse {
  success: boolean;
  transfer: TransferWithDetails;
}

export interface TransferActionResponse {
  success: boolean;
  message: string;
}

export interface TransferQueryParams {
  status?: TransferStatus;
  from_me?: boolean;
  to_me?: boolean;
  limit?: number;
  offset?: number;
}
