import { apiClient } from './apiClient';
import { Notification } from '../types/notification';

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
  /** GET /api/notifications — current user's notifications (newest first) */
  listNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/api/notifications');
    return extractNotifications(response.data);
  },

  /** PATCH /api/notifications/{id}/read — mark a notification as read */
  markRead: async (notificationId: number): Promise<void> => {
    await apiClient.patch(`/api/notifications/${notificationId}/read`);
  },
};
