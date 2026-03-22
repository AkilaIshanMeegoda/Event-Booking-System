'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, bookingsApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatCurrency, getCategoryColor, getCategoryGradient, getCategoryEmoji, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiArrowLeft, FiShare2, FiStar } from 'react-icons/fi';

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
    const params = new URLSearchParams({
      eventId: event._id,
      eventTitle: event.title,
      ticketCount: ticketCount.toString(),
      ticketPrice: event.ticketPrice.toString(),
      total: (event.ticketPrice * ticketCount).toString(),
    });
    router.push(`/payment?${params.toString()}`);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Remove this review?')) return;
    try {
      await reviewsApi.delete(reviewId);
      toast.success('Review removed');
      const data = await reviewsApi.getByEvent(event._id, 'limit=10&sortBy=newest');
      setReviews(data.reviews);
      setRatingDist(data.ratingDistribution || []);
      const evData = await eventsApi.getById(event._id);
      setEvent(evData.event);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove review');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
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
      const data = await reviewsApi.getByEvent(event._id, 'limit=10&sortBy=newest');
      setReviews(data.reviews);
      setRatingDist(data.ratingDistribution || []);
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
      <div className="min-h-screen bg-gray-50">
        <div className="h-64 sm:h-80 bg-gray-200 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Link href="/events" className="text-blue-600 hover:underline font-medium">← Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image Banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(event.category)} flex items-center justify-center`}>
            <span className="text-[120px] opacity-20">{getCategoryEmoji(event.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button overlay */}
        <div className="absolute top-4 left-4">
          <Link href="/events" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition text-sm font-medium">
            <FiArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
        </div>

        {/* Event title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              {event.averageRating > 0 && (
                <span className="text-sm text-white/90 flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  ⭐ {event.averageRating.toFixed(1)} ({event.totalReviews} reviews)
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{event.title}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <FiCalendar className="w-4 h-4" />
                  <span className="text-xs text-gray-500 font-medium">Date</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{formatDate(event.date)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <FiClock className="w-4 h-4" />
                  <span className="text-xs text-gray-500 font-medium">Time</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{event.time}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <FiMapPin className="w-4 h-4" />
                  <span className="text-xs text-gray-500 font-medium">Venue</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{event.venue}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <FiUsers className="w-4 h-4" />
                  <span className="text-xs text-gray-500 font-medium">Capacity</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{event.totalTickets} seats</p>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              {event.location && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FiMapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{event.venue}, {event.location}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reviews ({event.totalReviews})</h2>
                {user && (
                  <button
                    onClick={() => setShowReview(!showReview)}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                  >
                    {showReview ? 'Cancel' : '✍️ Write a Review'}
                  </button>
                )}
              </div>

              {/* Rating Distribution */}
              {ratingDist.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">{event.averageRating?.toFixed(1) || '0'}</div>
                      <div className="text-sm text-gray-500 mt-1">out of 5</div>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingDist.find((r: any) => r._id === star)?.count || 0;
                        const total = ratingDist.reduce((sum: number, r: any) => sum + r.count, 0);
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-sm mb-1">
                            <span className="w-6 text-right text-gray-600">{star}</span>
                            <FiStar className="w-3.5 h-3.5 text-amber-400" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-gray-400 text-xs">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Review Form */}
              {showReview && (
                <form onSubmit={handleSubmitReview} className="bg-blue-50 rounded-xl p-5 mb-6">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className={`text-3xl transition cursor-pointer ${star <= reviewForm.rating ? 'text-amber-400' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      required
                      value={reviewForm.title}
                      onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                      placeholder="Sum up your experience"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                    <textarea
                      required
                      rows={3}
                      value={reviewForm.comment}
                      onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm resize-none"
                      placeholder="Share details about your experience"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review._id} className="border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {review.userName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{review.userName}</p>
                            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-amber-400 text-sm">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{review.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  {formatCurrency(event.ticketPrice)}
                </div>
                <p className="text-sm text-gray-500">per ticket</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Available</span>
                  <span className="font-semibold text-gray-900">{event.availableTickets} / {event.totalTickets}</span>
                </div>
                {event.availableTickets > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        event.availableTickets / event.totalTickets > 0.3 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${(event.availableTickets / event.totalTickets) * 100}%` }}
                    />
                  </div>
                )}
                {event.availableTickets > 0 && event.availableTickets < event.totalTickets * 0.2 && (
                  <p className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-lg text-center">
                    🔥 Only {event.availableTickets} tickets left!
                  </p>
                )}
              </div>

              {event.availableTickets > 0 ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Tickets</label>
                    <select
                      value={ticketCount}
                      onChange={e => setTicketCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white"
                    >
                      {Array.from({ length: Math.min(10, event.availableTickets) }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium mb-6 pb-4 border-b border-gray-100">
                    <span className="text-gray-500">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(event.ticketPrice * ticketCount)}</span>
                  </div>
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-lg hover:shadow-xl text-lg cursor-pointer"
                  >
                    {booking ? 'Processing...' : '🎟️ Book Now'}
                  </button>
                  {!user && (
                    <p className="text-xs text-gray-400 text-center mt-3">
                      You&apos;ll need to <Link href="/login" className="text-blue-600 font-medium">log in</Link> first
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">😔</div>
                  <p className="text-red-500 font-bold text-lg">Sold Out</p>
                  <p className="text-xs text-gray-400 mt-1">Check back later for availability</p>
                </div>
              )}

              {/* Share */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-blue-600 transition cursor-pointer"
                >
                  <FiShare2 className="w-4 h-4" /> Share this event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
