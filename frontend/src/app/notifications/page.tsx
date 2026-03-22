'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';

const typeConfig: Record<string, { icon: string; color: string }> = {
  booking_confirmation: { icon: '✅', color: 'bg-emerald-100 text-emerald-600' },
  booking_cancellation: { icon: '❌', color: 'bg-red-100 text-red-600' },
  payment_success: { icon: '💰', color: 'bg-green-100 text-green-600' },
  payment_failed: { icon: '⚠️', color: 'bg-amber-100 text-amber-600' },
  payment_refund: { icon: '💸', color: 'bg-blue-100 text-blue-600' },
  review_posted: { icon: '⭐', color: 'bg-yellow-100 text-yellow-600' },
  event_reminder: { icon: '🔔', color: 'bg-blue-100 text-blue-600' },
  general: { icon: '📢', color: 'bg-gray-100 text-gray-600' },
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchNotifications();
  }, [user, authLoading, page]);

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

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-10">
        <div className="max-w-3xl mx-auto px-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <FiBell className="w-7 h-7" /> Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-blue-100 mt-1">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white/10 backdrop-blur text-white text-sm font-medium rounded-lg hover:bg-white/20 transition"
            >
              <FiCheck className="w-4 h-4 inline mr-1" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-5 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-xl font-semibold text-gray-900 mb-2">No notifications yet</p>
            <p className="text-gray-500">We&apos;ll notify you about bookings, payments, and more</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.general;
              return (
                <div
                  key={notif._id}
                  className={`bg-white rounded-2xl p-5 transition shadow-sm hover:shadow-md ${
                    !notif.isRead ? 'border-l-4 border-blue-500' : 'border border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(notif.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                      <div className="flex gap-3 mt-3">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif._id)}
                            className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                          >
                            <FiCheck className="w-3 h-3" /> Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif._id)}
                          className="text-xs text-red-500 font-medium hover:text-red-600 flex items-center gap-1"
                        >
                          <FiTrash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-sm font-medium transition ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
