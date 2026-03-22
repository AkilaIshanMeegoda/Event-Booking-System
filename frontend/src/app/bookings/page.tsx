'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiCreditCard, FiTag, FiArrowRight } from 'react-icons/fi';

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="text-blue-100 mt-1">Track and manage all your event bookings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['', 'confirmed', 'cancelled', 'failed'].map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {status || 'All Bookings'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-6 shadow-sm">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-xl font-semibold text-gray-900 mb-2">No bookings found</p>
            <p className="text-gray-500 mb-6">Start by browsing our exciting events!</p>
            <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
              Browse Events <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link href={`/bookings/${booking._id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition">
                        {booking.eventTitle}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5" />
                        Booked on {formatDate(booking.bookingDate)}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-5 text-sm mb-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <FiTag className="w-4 h-4 text-blue-500" />
                      <span>{booking.ticketCount} ticket{booking.ticketCount > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiCreditCard className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-blue-600">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <span className={`font-medium capitalize ${booking.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {booking.paymentStatus === 'completed' ? '✓ Paid' : booking.paymentStatus}
                      </span>
                    </div>
                    {booking.venue && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <FiMapPin className="w-4 h-4 text-blue-500" />
                        <span>{booking.venue}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/bookings/${booking._id}`}
                      className="px-4 py-2 text-sm font-medium bg-gray-50 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      View Details
                    </Link>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

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
