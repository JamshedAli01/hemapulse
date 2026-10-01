export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// Matches the backend NotificationOut schema (notifications.py)
export interface Notification {
  id: number;
  title: string | null;
  message: string;
  status: string; // e.g. 'SENT', 'READ'
  request_id: number | null;
  created_at: string;
  // Additional optional fields the backend may include
  channel?: NotificationChannel | string;
  donor_id?: number;
}
