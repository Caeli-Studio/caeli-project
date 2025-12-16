import { apiService } from './api.service';

import type {
  CreateTransferRequest,
  CreateTransferResponse,
  GetTransferResponse,
  GetTransfersResponse,
  TransferActionResponse,
  TransferQueryParams,
} from '@/types/transfer';

/**
 * Transfer Service
 * Handles all task transfer-related API operations
 */
class TransferService {
  /**
   * Create a new transfer request
   * @param groupId - The group/household ID
   * @param data - Transfer creation data
   */
  async createTransfer(
    groupId: string,
    data: CreateTransferRequest
  ): Promise<CreateTransferResponse> {
    return apiService.post<CreateTransferResponse>(
      `/api/groups/${groupId}/transfers`,
      data
    );
  }

  /**
   * Get all transfers for a group
   * @param groupId - The group/household ID
   * @param params - Query parameters for filtering
   */
  async getTransfers(
    groupId: string,
    params?: TransferQueryParams
  ): Promise<GetTransfersResponse> {
    const queryString = params ? this.buildQueryString(params) : '';
    return apiService.get<GetTransfersResponse>(
      `/api/groups/${groupId}/transfers${queryString}`
    );
  }

  /**
   * Get a specific transfer
   * @param groupId - The group/household ID
   * @param transferId - The transfer ID
   */
  async getTransfer(
    groupId: string,
    transferId: string
  ): Promise<GetTransferResponse> {
    return apiService.get<GetTransferResponse>(
      `/api/groups/${groupId}/transfers/${transferId}`
    );
  }

  /**
   * Accept a transfer request
   * @param groupId - The group/household ID
   * @param transferId - The transfer ID
   */
  async acceptTransfer(
    groupId: string,
    transferId: string
  ): Promise<TransferActionResponse> {
    return apiService.post<TransferActionResponse>(
      `/api/groups/${groupId}/transfers/${transferId}/accept`,
      {}
    );
  }

  /**
   * Refuse a transfer request
   * @param groupId - The group/household ID
   * @param transferId - The transfer ID
   */
  async refuseTransfer(
    groupId: string,
    transferId: string
  ): Promise<TransferActionResponse> {
    return apiService.post<TransferActionResponse>(
      `/api/groups/${groupId}/transfers/${transferId}/refuse`,
      {}
    );
  }

  /**
   * Cancel a transfer request (only by creator)
   * @param groupId - The group/household ID
   * @param transferId - The transfer ID
   */
  async cancelTransfer(
    groupId: string,
    transferId: string
  ): Promise<TransferActionResponse> {
    return apiService.delete<TransferActionResponse>(
      `/api/groups/${groupId}/transfers/${transferId}`
    );
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: TransferQueryParams): string {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.from_me !== undefined)
      queryParams.append('from_me', String(params.from_me));
    if (params.to_me !== undefined)
      queryParams.append('to_me', String(params.to_me));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}

// Export singleton instance
export const transferService = new TransferService();
