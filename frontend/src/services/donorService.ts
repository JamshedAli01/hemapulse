import { apiClient } from './apiClient';
import { DonorProfile, DonorRequest, DonorListParams, UpdateDonorAvailability } from '../types/donor';

export const donorService = {
  listDonors: async (params?: DonorListParams): Promise<unknown> => {
    const response = await apiClient.get('/api/donors', { params });
    return response.data;
  },

  createProfile: async (data: DonorRequest): Promise<void> => {
    await apiClient.post('/api/donors', data);
  },

  getDonor: async (id: number): Promise<DonorProfile> => {
    const response = await apiClient.get<DonorProfile>(`/api/donors/${id}`);
    return response.data;
  },

  updateAvailability: async (id: number, data: UpdateDonorAvailability): Promise<void> => {
    await apiClient.patch(`/api/donors/${id}/availability`, data);
  },
};
