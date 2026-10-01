import { apiClient } from './apiClient';
import { DonorResponseRequest, DeclineRequest } from '../types/response';

export const donorResponseService = {
  acceptRequest: async (requestId: number, data: DonorResponseRequest): Promise<void> => {
    await apiClient.post(`/api/responses/${requestId}/accept`, data);
  },

  declineRequest: async (requestId: number, data: DeclineRequest): Promise<void> => {
    await apiClient.post(`/api/responses/${requestId}/decline`, data);
  },
};
