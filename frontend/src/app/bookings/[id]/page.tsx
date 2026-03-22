'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi, paymentsApi } from '@/lib/api';
import { formatDate, formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-secondary rounded w-1/2" />
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-40 bg-secondary rounded" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
        <Link href="/bookings" className="text-primary hover:underline">← Back to Bookings</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/bookings" className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Back to Bookings
      </Link>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-primary to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold mb-1">{booking.eventTitle}</h1>
              <p className="text-white/80 text-sm">Booking #{booking._id.slice(-8).toUpperCase()}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted mb-0.5">Tickets</p>
              <p className="font-semibold">{booking.ticketCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Total Amount</p>
              <p className="font-semibold text-primary">{formatCurrency(booking.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Booking Date</p>
              <p className="font-medium text-sm">{formatDateTime(booking.bookingDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Payment Status</p>
              <p className={`font-medium text-sm capitalize ${booking.paymentStatus === 'completed' ? 'text-success' : booking.paymentStatus === 'refunded' ? 'text-accent' : 'text-muted'}`}>
                {booking.paymentStatus}
              </p>
            </div>
            {booking.eventDate && (
              <div>
                <p className="text-xs text-muted mb-0.5">Event Date</p>
                <p className="font-medium text-sm">{formatDate(booking.eventDate)}</p>
              </div>
            )}
            {booking.venue && (
              <div>
                <p className="text-xs text-muted mb-0.5">Venue</p>
                <p className="font-medium text-sm">{booking.venue}</p>
              </div>
            )}
          </div>

          {booking.cancelledAt && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-danger">Cancelled on {formatDateTime(booking.cancelledAt)}</p>
              {booking.cancelReason && (
                <p className="text-sm text-muted mt-1">Reason: {booking.cancelReason}</p>
              )}
            </div>
          )}

          {payment && (
            <div className="bg-secondary/40 border border-border rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Payment & Refund Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Transaction ID</p>
                  <p className="font-medium break-all">{payment.transactionId || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Payment Method</p>
                  <p className="font-medium capitalize">{payment.paymentMethod || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Payment Status</p>
                  <p className="font-medium capitalize">{payment.status}</p>
                </div>
                {payment.refundedAt && (
                  <div>
                    <p className="text-xs text-muted">Refunded At</p>
                    <p className="font-medium">{formatDateTime(payment.refundedAt)}</p>
                  </div>
                )}
                {payment.stripeRefundId && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted">Stripe Refund Reference</p>
                    <p className="font-medium break-all">{payment.stripeRefundId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href={`/events/${booking.eventId}`} className="px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-primary/10 transition">
              View Event
            </Link>
            {booking.status === 'confirmed' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-50 text-danger rounded-lg text-sm hover:bg-red-100 transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
