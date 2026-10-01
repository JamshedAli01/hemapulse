export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface SendNotificationRequest {
  donor_ids: number[];
  channel: NotificationChannel;
}

/**
 * A notification record as returned by GET /api/notifications.
 * The YAML response is unspecified so we type the realistic shape.
 */
export interface Notification {
  id: number;
  message?: string;
  title?: string;
  channel?: NotificationChannel | string;
  request_id?: number;
  donor_id?: number;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  sent_at?: string;
  status?: string;
  [key: string]: unknown;
}
