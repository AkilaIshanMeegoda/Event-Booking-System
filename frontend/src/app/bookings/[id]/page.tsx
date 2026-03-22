'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi, paymentsApi } from '@/lib/api';
import { formatDate, formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiArrowLeft, FiCalendar, FiMapPin, FiCreditCard, FiHash, FiClock } from 'react-icons/fi';

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!id) return;
    bookingsApi.getById(id as string)
      .then(async (d) => {
        setBooking(d.booking);

        if (d.booking?.paymentId) {
          try {
            const paymentRes = await paymentsApi.getById(d.booking.paymentId);
            setPayment(paymentRes.payment);
          } catch {
            setPayment(null);
          }
        }
      })
      .catch(() => toast.error('Booking not found'))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      const data = await bookingsApi.cancel(booking._id, 'Cancelled by user');
      setBooking(data.booking);

      if (data.booking?.paymentId) {
        try {
          const paymentRes = await paymentsApi.getById(data.booking.paymentId);
          setPayment(paymentRes.payment);
        } catch {
          setPayment(null);
        }
      }

      toast.success('Booking cancelled successfully');
    } catch (err: any) {
      toast.error(err.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
        <Link href="/bookings" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Bookings</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-6 transition">
          <FiArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold mb-1">{booking.eventTitle}</h1>
                <p className="text-white/70 text-sm flex items-center gap-1.5">
                  <FiHash className="w-3.5 h-3.5" /> {booking._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiCreditCard className="w-3 h-3" /> Tickets</p>
                <p className="font-bold text-gray-900 text-lg">{booking.ticketCount}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                <p className="font-bold text-blue-600 text-lg">{formatCurrency(booking.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiClock className="w-3 h-3" /> Booking Date</p>
                <p className="font-medium text-gray-900 text-sm">{formatDateTime(booking.bookingDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                <p className={`font-semibold text-sm capitalize ${booking.paymentStatus === 'completed' ? 'text-emerald-600' : booking.paymentStatus === 'refunded' ? 'text-amber-600' : 'text-gray-500'}`}>
                  {booking.paymentStatus === 'completed' ? '✓ Paid' : booking.paymentStatus}
                </p>
              </div>
              {booking.eventDate && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Event Date</p>
                  <p className="font-medium text-gray-900 text-sm">{formatDate(booking.eventDate)}</p>
                </div>
              )}
              {booking.venue && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiMapPin className="w-3 h-3" /> Venue</p>
                  <p className="font-medium text-gray-900 text-sm">{booking.venue}</p>
                </div>
              )}
            </div>

            {booking.cancelledAt && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-600">Cancelled on {formatDateTime(booking.cancelledAt)}</p>
                {booking.cancelReason && (
                  <p className="text-sm text-red-500 mt-1">Reason: {booking.cancelReason}</p>
                )}
              </div>
            )}

            {payment && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-900 mb-3">Payment & Refund Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Transaction ID</p>
                    <p className="font-medium text-gray-900 break-all">{payment.transactionId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-medium text-gray-900 capitalize">{payment.paymentMethod || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Status</p>
                    <p className="font-medium text-gray-900 capitalize">{payment.status}</p>
                  </div>
                  {payment.refundedAt && (
                    <div>
                      <p className="text-xs text-gray-500">Refunded At</p>
                      <p className="font-medium text-gray-900">{formatDateTime(payment.refundedAt)}</p>
                    </div>
                  )}
                  {payment.stripeRefundId && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Stripe Refund Reference</p>
                      <p className="font-medium text-gray-900 break-all">{payment.stripeRefundId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link href={`/events/${booking.eventId}`} className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition">
                View Event
              </Link>
              {booking.status === 'confirmed' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
