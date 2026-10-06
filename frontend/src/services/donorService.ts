import { apiClient } from './apiClient';
import {
  DonorProfile,
  DonorRequest,
  DonorListParams,
  DonorProfileUpdate,
  UpdateDonorAvailability,
} from '../types/donor';
import { DonorMatch } from '../types/donor';

export const donorService = {
  listDonors: async (params?: DonorListParams): Promise<DonorProfile[]> => {
    const response = await apiClient.get<DonorProfile[]>('/api/donors/available', { params });
    return response.data;
  },

  createProfile: async (data: Omit<DonorRequest, 'user_id' | 'is_eligible'>): Promise<DonorProfile> => {
    const response = await apiClient.post<DonorProfile>('/api/donors/profile', data);
    return response.data;
  },

  getDonor: async (): Promise<DonorProfile> => {
    const response = await apiClient.get<DonorProfile>('/api/donors/profile');
    return response.data;
  },

  updateAvailability: async (data: UpdateDonorAvailability): Promise<DonorProfile> => {
    const response = await apiClient.put<DonorProfile>('/api/donors/profile', data);
    return response.data;
  },

  updateProfile: async (data: DonorProfileUpdate): Promise<DonorProfile> => {
    const response = await apiClient.put<DonorProfile>('/api/donors/profile', data);
    return response.data;
  },

  listMatches: async (): Promise<DonorMatch[]> => {
    const response = await apiClient.get<DonorMatch[]>('/api/donors/matches');
    return response.data;
  },
};
