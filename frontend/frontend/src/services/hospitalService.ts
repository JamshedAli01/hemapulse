import { apiClient } from './apiClient';
import { Hospital, HospitalRequest } from '../types/hospital';

export const hospitalService = {
  listHospitals: async (): Promise<unknown> => {
    const response = await apiClient.get('/api/hospitals');
    return response.data;
  },

  createHospital: async (data: HospitalRequest): Promise<void> => {
    await apiClient.post('/api/hospitals', data);
  },

  getHospital: async (id: number): Promise<Hospital> => {
    const response = await apiClient.get<Hospital>(`/api/hospitals/${id}`);
    return response.data;
  },
};
