'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const eventId = searchParams.get('eventId') || '';
  const eventTitle = searchParams.get('eventTitle') || '';
  const ticketCount = Number(searchParams.get('ticketCount') || '1');
  const ticketPrice = Number(searchParams.get('ticketPrice') || '0');
  const total = Number(searchParams.get('total') || '0');

  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
    if (!eventId) router.push('/events');
  }, [user, authLoading, eventId, router]);

  const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const cardDigits = cardForm.cardNumber.replace(/\s/g, '');
    if (cardDigits.length < 16) {
      toast.error('Please enter a valid 16-digit card number');
      return;
    }
    if (!cardForm.cardName.trim()) {
      toast.error('Please enter the cardholder name');
      return;
    }
    if (cardForm.expiry.length < 5) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return;
    }
    if (cardForm.cvv.length < 3) {
      toast.error('Please enter a valid CVV');
      return;
    }

    setStep('processing');

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Create the booking (which triggers backend payment processing)
      const data = await bookingsApi.create({ eventId, ticketCount });

      if (data.booking.status === 'confirmed') {
        setBookingId(data.booking._id);
        setStep('success');
      } else {
        setStep('failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
      setStep('failed');
    }
  };

  if (!user || !eventId) return null;

  // Processing step
  if (step === 'processing') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-2">Processing Payment...</h2>
          <p className="text-muted text-sm">Please don&apos;t close this page</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-left">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Event</span>
            <span className="font-medium">{eventTitle}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Tickets</span>
            <span className="font-medium">{ticketCount}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h2>
        <p className="text-muted mb-2">Your booking has been confirmed</p>
        <p className="text-sm text-muted mb-6">
          {ticketCount} ticket{ticketCount > 1 ? 's' : ''} for <strong>{eventTitle}</strong>
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-700">Amount Paid</span>
            <span className="font-bold text-green-800">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-700">Status</span>
            <span className="font-medium text-green-800">Confirmed ✓</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href={bookingId ? `/bookings/${bookingId}` : '/bookings'}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
          >
            View Booking
          </Link>
          <Link
            href="/events"
            className="px-5 py-2.5 bg-secondary rounded-lg text-sm font-medium hover:bg-primary/10 transition"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  // Failed step
  if (step === 'failed') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-red-700">Payment Failed</h2>
        <p className="text-muted mb-6">The payment could not be processed. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setStep('form')}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
          >
            Try Again
          </button>
          <Link
            href={`/events/${eventId}`}
            className="px-5 py-2.5 bg-secondary rounded-lg text-sm font-medium hover:bg-primary/10 transition"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  // Payment form step
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href={`/events/${eventId}`} className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Back to Event
      </Link>

      <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

      <div className="grid gap-6">
        {/* Order Summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-muted mb-3">ORDER SUMMARY</h3>
          <p className="font-semibold mb-3">{eventTitle}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Tickets × {ticketCount}</span>
              <span>{formatCurrency(ticketPrice)} each</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-muted mb-4">PAYMENT DETAILS</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cardForm.cardNumber}
                  onChange={e => setCardForm({ ...cardForm, cardNumber: formatCard(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition text-base tracking-wider"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <span className="text-lg">💳</span>
                </div>
              </div>
              <p className="text-xs text-muted mt-1">Demo: enter any 16 digits</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardForm.cardName}
                onChange={e => setCardForm({ ...cardForm, cardName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input
                  type="text"
                  required
                  value={cardForm.expiry}
                  onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="text"
                  required
                  value={cardForm.cvv}
                  onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <button
              type="submit"
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition text-base"
            >
              Pay {formatCurrency(total)}
            </button>
            <p className="text-xs text-center text-muted mt-3">
              🔒 This is a demo payment — no real charges will be made
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <PaymentForm />
    </Suspense>
  );
}
