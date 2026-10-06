import { useState, useEffect, useCallback } from 'react';
import { Bell, RefreshCcw, Clock, Droplet } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { handleApiError } from '../services/apiClient';
import { Notification, NotificationChannel } from '../types/notification';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardContent } from '../components/ui/Card';

function formatTime(dt?: string): string {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return dt;
  }
}

function channelLabel(channel?: string): string {
  switch (channel) {
    case NotificationChannel.IN_APP: return 'In-App';
    case NotificationChannel.EMAIL: return 'Email';
    case NotificationChannel.SMS: return 'SMS';
    default: return channel ?? 'Notification';
  }
}

function channelVariant(channel?: string): 'default' | 'outline' | 'secondary' {
  switch (channel) {
    case NotificationChannel.EMAIL: return 'secondary';
    case NotificationChannel.SMS: return 'outline';
    default: return 'default';
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingRead, setMarkingRead] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await notificationService.listNotifications();
      setNotifications(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAsRead = async (notification: Notification) => {
    if (notification.status === 'READ' || markingRead.has(notification.id)) return;

    setMarkingRead((current) => new Set(current).add(notification.id));
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, status: 'READ' } : item
        )
      );
      window.dispatchEvent(new Event('hemapulse:notifications-updated'));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setMarkingRead((current) => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System alerts and emergency broadcasts.
          </p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-muted-foreground">
          <Spinner size="md" />
          <span className="text-sm">Loading notifications…</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>{error}</span>
            <button onClick={load} className="inline-flex items-center gap-1 text-xs underline underline-offset-2">
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty */}
      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          title="No notifications yet"
          description="You'll receive alerts here when there are updates to blood requests, donor matches, or system announcements."
          icon={<Bell className="h-6 w-6" />}
        />
      )}

      {/* Notification list */}
      {!isLoading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
          {notifications.map((notif) => {
            const isUnread = notif.status !== 'READ';
            const timestamp = notif.sent_at ?? notif.created_at;
            return (
              <Card
                key={notif.id}
                className={isUnread ? 'border-primary/30 bg-primary/5' : ''}
                onClick={() => markAsRead(notif)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0">
                      {isUnread
                        ? <span className="block h-2 w-2 rounded-full bg-primary" />
                        : <span className="block h-2 w-2 rounded-full bg-muted" />
                      }
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Title/message */}
                      <p className="text-sm font-medium">
                        {notif.title ?? notif.message ?? 'Notification'}
                      </p>
                      {notif.title && notif.message && (
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {notif.channel && (
                          <Badge variant={channelVariant(notif.channel as string)} className="text-xs">
                            {channelLabel(notif.channel as string)}
                          </Badge>
                        )}
                        {notif.status && (
                          <Badge variant="outline" className="text-xs">{notif.status}</Badge>
                        )}
                        {notif.request_id && (
                          <Link
                            to={`/requests/${notif.request_id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Droplet className="h-3 w-3" />
                            Request #{notif.request_id}
                          </Link>
                        )}
                        {timestamp && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <Clock className="h-3 w-3" />
                            {formatTime(timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
