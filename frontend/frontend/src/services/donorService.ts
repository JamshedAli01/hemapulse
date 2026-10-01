import { apiClient } from './apiClient';
import { DonorProfile, DonorRequest, UpdateDonorAvailability } from '../types/donor';

export const donorService = {
  /** GET /api/donors/available — list available, eligible donors */
  listAvailableDonors: async (): Promise<DonorProfile[]> => {
    const response = await apiClient.get<DonorProfile[]>('/api/donors/available');
    return response.data;
  },

  /** POST /api/donors/profile — create current user's donor profile */
  createProfile: async (data: DonorRequest): Promise<DonorProfile> => {
    const response = await apiClient.post<DonorProfile>('/api/donors/profile', data);
    return response.data;
  },

  /** GET /api/donors/profile — get current user's donor profile */
  getMyProfile: async (): Promise<DonorProfile> => {
    const response = await apiClient.get<DonorProfile>('/api/donors/profile');
    return response.data;
  },

  /** PUT /api/donors/profile — update current user's donor profile */
  updateProfile: async (data: UpdateDonorAvailability): Promise<DonorProfile> => {
    const response = await apiClient.put<DonorProfile>('/api/donors/profile', data);
    return response.data;
  },
};
