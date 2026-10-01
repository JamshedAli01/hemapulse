import { apiClient } from './apiClient';
import { SendNotificationRequest, Notification } from '../types/notification';

function extractNotifications(raw: unknown): Notification[] {
  if (Array.isArray(raw)) return raw as Notification[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.notifications)) return obj.notifications as Notification[];
    if (Array.isArray(obj.items)) return obj.items as Notification[];
  }
  return [];
}

export const notificationService = {
  /** POST /api/notifications/{request_id}/send */
  sendNotification: async (requestId: number, data: SendNotificationRequest): Promise<void> => {
    await apiClient.post(`/api/notifications/${requestId}/send`, data);
  },

  /** GET /api/notifications — current user's notifications */
  listNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/api/notifications');
    return extractNotifications(response.data);
  },
};
