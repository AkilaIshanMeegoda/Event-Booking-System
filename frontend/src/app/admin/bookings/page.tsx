'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchBookings();
  }, [user, authLoading, page, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '15');
      const data = await bookingsApi.getAll(params.toString());
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingsApi.cancel(id, 'Cancelled by admin');
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">All Bookings</h1>

      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: 'All Bookings', href: '/admin/bookings', active: true },
          { label: 'Payments', href: '/admin/payments' },
          { label: 'All Events', href: '/admin/events' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${item.active ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'}`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'confirmed', /* 'pending', */ 'cancelled', /* 'refunded', */ 'failed'].map(status => (
          <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${statusFilter === status ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'}`}>
            {status || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded" />)}
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-center text-muted py-12">No bookings found</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">User Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Tickets</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{b.eventTitle}</td>
                    <td className="px-4 py-3 text-muted text-xs">{b.userEmail || b.userId}</td>
                    <td className="px-4 py-3">{b.ticketCount}</td>
                    <td className="px-4 py-3 text-primary font-medium">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(b.paymentStatus)}`}>{b.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(b.bookingDate)}</td>
                    <td className="px-4 py-3 text-right">
                      {b.status === 'confirmed' && (
                        <button onClick={() => handleCancel(b._id)}
                          className="text-xs text-danger hover:underline">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-border">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">Previous</button>
              <span className="text-sm text-muted">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="px-3 py-1.5 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
