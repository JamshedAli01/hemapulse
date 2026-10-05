import { apiClient } from './apiClient';
import { Hospital, HospitalRequest, LocationResult } from '../types/hospital';

export const hospitalService = {
  listHospitals: async (): Promise<Hospital[]> => {
    const response = await apiClient.get<Hospital[]>('/api/hospitals');
    return response.data;
  },

  createHospital: async (data: HospitalRequest): Promise<Hospital> => {
    const response = await apiClient.post<Hospital>('/api/hospitals', data);
    return response.data;
  },

  getHospital: async (id: number): Promise<Hospital> => {
    const response = await apiClient.get<Hospital>(`/api/hospitals/${id}`);
    return response.data;
  },

  resolveLocation: async (query: string): Promise<LocationResult[]> => {
    const response = await apiClient.get<LocationResult[]>('/api/hospitals/resolve', {
      params: { query },
    });
    return response.data;
  },
};
