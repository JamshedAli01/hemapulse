import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for JWT authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hemapulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface ApiErrorResponse {
  message?: string;
  detail?: string | any[];
}

// Simple helper to handle and format API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.detail) {
      if (typeof axiosError.response.data.detail === 'string') {
        return axiosError.response.data.detail;
      }
      return JSON.stringify(axiosError.response.data.detail);
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    return axiosError.message;
  }
  return 'An unexpected error occurred';
};
