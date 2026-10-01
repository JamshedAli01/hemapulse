import { apiClient } from './apiClient';
import { DonationCreate, ConfirmDonation, ConfirmQRRequest, Donation, QRTokenResponse } from '../types/donation';

export const donationService = {
  /** POST /api/donations — schedule a donation */
  createDonation: async (data: DonationCreate): Promise<Donation> => {
    const response = await apiClient.post<Donation>('/api/donations', data);
    return response.data;
  },

  /** PATCH /api/donations/{id}/confirm — confirm a completed donation */
  confirmDonation: async (id: number, data: ConfirmDonation): Promise<void> => {
    await apiClient.patch(`/api/donations/${id}/confirm`, data);
  },

  /** POST /api/donations/{id}/qr — generate QR token */
  generateQR: async (id: number): Promise<QRTokenResponse> => {
    const response = await apiClient.post<QRTokenResponse>(`/api/donations/${id}/qr`);
    return response.data;
  },

  /** POST /api/donations/confirm-qr — verify QR token */
  confirmQR: async (data: ConfirmQRRequest): Promise<void> => {
    await apiClient.post('/api/donations/confirm-qr', data);
  },
};
