import { apiClient } from './apiClient';
import {
  BloodRequest,
  BloodRequestCreate,
  VerifyRequest,
  RequestListParams,
} from '../types/request';

export const requestService = {
  listRequests: async (params?: RequestListParams): Promise<BloodRequest[]> => {
    const response = await apiClient.get<BloodRequest[]>('/api/requests', { params });
    // Some FastAPI list endpoints return an array directly, others { items, total }
    // Handle both shapes gracefully
    const raw = response.data as unknown;
    if (Array.isArray(raw)) return raw as BloodRequest[];
    const shaped = raw as { items?: BloodRequest[] };
    if (shaped?.items && Array.isArray(shaped.items)) return shaped.items;
    return [];
  },

  createRequest: async (data: BloodRequestCreate): Promise<BloodRequest> => {
    const response = await apiClient.post<BloodRequest>('/api/requests', data);
    return response.data;
  },

  getRequest: async (id: number): Promise<BloodRequest> => {
    const response = await apiClient.get<BloodRequest>(`/api/requests/${id}`);
    return response.data;
  },

  // PATCH body is { type: object } in the YAML — we send only safe fields
  updateRequest: async (id: number, data: Record<string, unknown>): Promise<BloodRequest> => {
    const response = await apiClient.patch<BloodRequest>(`/api/requests/${id}`, data);
    return response.data;
  },

  verifyRequest: async (id: number, data: VerifyRequest): Promise<void> => {
    await apiClient.patch(`/api/requests/${id}/verify`, data);
  },

  cancelRequest: async (id: number): Promise<void> => {
    await apiClient.post(`/api/requests/${id}/cancel`);
  },
};
