'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { reviewsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiStar, FiEdit3, FiTrash2, FiArrowRight } from 'react-icons/fi';

export default function MyReviewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewsApi.getMy();
      setReviews(data.reviews);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditingId(review._id);
    setEditForm({ rating: review.rating, title: review.title, comment: review.comment });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await reviewsApi.update(id, editForm);
      toast.success('Review updated!');
      setEditingId(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewsApi.delete(id);
      toast.success('Review deleted');
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  const renderStars = (count: number, interactive = false, onChange?: (n: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'} ${
            n <= count ? 'text-amber-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FiStar className="w-7 h-7" /> My Reviews
          </h1>
          <p className="text-blue-100 mt-1">Manage your event reviews and feedback</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-5 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500 mb-6">Book an event and share your experience!</p>
            <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
              Browse Events <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                {editingId === review._id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                      {renderStars(editForm.rating, true, n => setEditForm({ ...editForm, rating: n }))}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Comment</label>
                      <textarea
                        rows={3}
                        value={editForm.comment}
                        onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white text-sm resize-none transition"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(review._id)}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-5 py-2 bg-gray-50 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/events/${review.eventId}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          {review.eventTitle || 'View Event'}
                        </Link>
                        <h3 className="font-bold text-gray-900 mt-1">{review.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(review)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">{review.comment}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
