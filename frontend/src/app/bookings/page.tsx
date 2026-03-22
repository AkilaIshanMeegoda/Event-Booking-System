'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [user, authLoading, statusFilter, page]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');
      const data = await bookingsApi.getMy(params.toString());
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? A refund will be processed.')) return;
    try {
      await bookingsApi.cancel(id, 'Cancelled by user');
      toast.success('Booking cancelled and refund initiated');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'confirmed', 'cancelled', 'failed'].map(status => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition capitalize ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'bg-secondary text-foreground/70 hover:bg-primary/10'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
              <div className="h-5 bg-secondary rounded w-1/3 mb-3" />
              <div className="h-4 bg-secondary rounded w-2/3 mb-2" />
              <div className="h-4 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted mb-2">No bookings found</p>
          <Link href="/events" className="text-primary hover:underline">Browse events →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-card border border-border rounded-xl p-6 hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/bookings/${booking._id}`} className="text-lg font-semibold hover:text-primary transition">
                    {booking.eventTitle}
                  </Link>
                  <p className="text-sm text-muted mt-1">
                    Booked on {formatDate(booking.bookingDate)}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-6 text-sm mb-4">
                <div>
                  <span className="text-muted">Tickets:</span>{' '}
                  <span className="font-medium">{booking.ticketCount}</span>
                </div>
                <div>
                  <span className="text-muted">Total:</span>{' '}
                  <span className="font-medium text-primary">{formatCurrency(booking.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-muted">Payment:</span>{' '}
                  <span className={`font-medium capitalize ${booking.paymentStatus === 'completed' ? 'text-success' : 'text-muted'}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
                {booking.venue && (
                  <div>
                    <span className="text-muted">Venue:</span>{' '}
                    <span className="font-medium">{booking.venue}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/bookings/${booking._id}`}
                  className="px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-primary/10 transition"
                >
                  View Details
                </Link>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="px-3 py-1.5 text-sm text-danger bg-red-50 rounded-lg hover:bg-red-100 transition"
                  >
                    Cancel Booking
                  </button>
                )}
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
