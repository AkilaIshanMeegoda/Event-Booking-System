'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, bookingsApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatCurrency, getCategoryColor, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingDist, setRatingDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketCount, setTicketCount] = useState(1);
  const [booking, setBooking] = useState(false);

  // Review form
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      eventsApi.getById(id as string),
      reviewsApi.getByEvent(id as string, 'limit=10&sortBy=newest'),
    ])
      .then(([eventData, reviewData]) => {
        setEvent(eventData.event);
        setReviews(reviewData.reviews);
        setRatingDist(reviewData.ratingDistribution || []);
      })
      .catch(() => toast.error('Event not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Navigate to fake payment page with booking details
    const params = new URLSearchParams({
      eventId: event._id,
      eventTitle: event.title,
      ticketCount: ticketCount.toString(),
      ticketPrice: event.ticketPrice.toString(),
      total: (event.ticketPrice * ticketCount).toString(),
    });
    router.push(`/payment?${params.toString()}`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsApi.create({
        eventId: event._id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        eventTitle: event.title,
      });
      toast.success('Review submitted!');
      setShowReview(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      // Refresh reviews
      const data = await reviewsApi.getByEvent(event._id, 'limit=10&sortBy=newest');
      setReviews(data.reviews);
      setRatingDist(data.ratingDistribution || []);
      // Refresh event for updated rating
      const evData = await eventsApi.getById(event._id);
      setEvent(evData.event);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-2/3" />
          <div className="h-4 bg-secondary rounded w-1/3" />
          <div className="h-32 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <Link href="/events" className="text-primary hover:underline">← Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/events" className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Detail */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(event.category)}`}>
              {event.category}
            </span>
            {event.averageRating > 0 && (
              <span className="text-sm text-warning">⭐ {event.averageRating.toFixed(1)} ({event.totalReviews} reviews)</span>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Date</p>
              <p className="font-medium">📅 {formatDate(event.date)}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Time</p>
              <p className="font-medium">🕐 {event.time}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Venue</p>
              <p className="font-medium">📍 {event.venue}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Location</p>
              <p className="font-medium">🌍 {event.location}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">About This Event</h2>
            <p className="text-muted leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Reviews Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Reviews ({event.totalReviews})</h2>
              {user && (
                <button
                  onClick={() => setShowReview(!showReview)}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  {showReview ? 'Cancel' : 'Write a Review'}
                </button>
              )}
            </div>

            {/* Rating Distribution */}
            {ratingDist.length > 0 && (
              <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratingDist.find((r: any) => r._id === star)?.count || 0;
                  const total = ratingDist.reduce((sum: number, r: any) => sum + r.count, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm mb-1">
                      <span className="w-8 text-right">{star}⭐</span>
                      <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                        <div className="bg-warning h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-muted">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Review Form */}
            {showReview && (
              <form onSubmit={handleSubmitReview} className="bg-card border border-border rounded-xl p-4 mb-6">
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className={`text-2xl transition ${star <= reviewForm.rating ? 'text-warning' : 'text-border'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.title}
                    onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="Sum up your experience"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                    placeholder="Share details about your experience"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p className="text-sm text-muted py-4">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review._id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                          {review.userName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{review.userName}</p>
                          <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-warning text-sm">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{review.title}</h4>
                    <p className="text-sm text-muted">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
            <div className="text-3xl font-bold text-primary mb-1">
              {formatCurrency(event.ticketPrice)}
            </div>
            <p className="text-sm text-muted mb-6">per ticket</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Available</span>
                <span className="font-medium">{event.availableTickets} / {event.totalTickets}</span>
              </div>
              {event.availableTickets > 0 && (
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-success h-full rounded-full transition-all"
                    style={{ width: `${(event.availableTickets / event.totalTickets) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {event.availableTickets > 0 ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Tickets</label>
                  <select
                    value={ticketCount}
                    onChange={e => setTicketCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm"
                  >
                    {Array.from({ length: Math.min(10, event.availableTickets) }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between text-sm font-medium mb-4 pb-4 border-b border-border">
                  <span>Total</span>
                  <span className="text-primary text-lg">{formatCurrency(event.ticketPrice * ticketCount)}</span>
                </div>
                <button
                  onClick={handleBook}
                  disabled={booking}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {booking ? 'Processing...' : 'Book Now'}
                </button>
                {!user && (
                  <p className="text-xs text-muted text-center mt-2">
                    You&apos;ll need to <Link href="/login" className="text-primary">log in</Link> first
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-danger font-semibold">Sold Out</p>
                <p className="text-xs text-muted mt-1">Check back later for availability</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
