'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const typeIcons: Record<string, string> = {
  booking_confirmation: '✅',
  booking_cancellation: '❌',
  payment_success: '💰',
  payment_failed: '⚠️',
  payment_refund: '💸',
  review_posted: '⭐',
  event_reminder: '🔔',
  general: '📢',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchNotifications();
  }, [user, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getMy(`page=${page}&limit=20`);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setPagination(data.pagination);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary font-medium hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-lg p-4">
              <div className="h-4 bg-secondary rounded w-2/3 mb-2" />
              <div className="h-3 bg-secondary rounded w-full" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔔</p>
          <p className="text-xl text-muted">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`bg-card border rounded-lg p-4 transition ${
                notif.isRead ? 'border-border' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{typeIcons[notif.type] || '📢'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-medium ${!notif.isRead ? 'text-foreground' : 'text-foreground/70'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-muted whitespace-nowrap">{formatDateTime(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted mt-1">{notif.message}</p>
                  <div className="flex gap-3 mt-2">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif._id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif._id)}
                      className="text-xs text-danger hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-secondary disabled:opacity-50 transition text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-muted px-4">Page {page} of {pagination.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-secondary disabled:opacity-50 transition text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
