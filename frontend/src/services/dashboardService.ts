import { apiClient } from './apiClient';

export interface DashboardSummary {
  total_donors?: number;
  total_requests?: number;
  total_hospitals?: number;
  active_requests?: number;
  fulfilled_requests?: number;
  total_donations?: number;
  [key: string]: unknown;
}

export interface BloodGroupStat {
  blood_group: string;
  count: number;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/api/dashboard/summary');
    return response.data;
  },

  getBloodGroups: async (): Promise<BloodGroupStat[]> => {
    const response = await apiClient.get<BloodGroupStat[]>('/api/dashboard/blood-groups');
    return response.data;
  },

  getRequestsAnalytics: async (): Promise<unknown> => {
    const response = await apiClient.get('/api/dashboard/requests');
    return response.data;
  },

  getFulfillmentAnalytics: async (): Promise<unknown> => {
    const response = await apiClient.get('/api/dashboard/fulfillment');
    return response.data;
  },
};
