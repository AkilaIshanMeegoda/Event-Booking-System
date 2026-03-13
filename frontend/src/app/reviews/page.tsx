'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { reviewsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
            n <= count ? 'text-yellow-500' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-5">
              <div className="h-4 bg-secondary rounded w-1/3 mb-3" />
              <div className="h-3 bg-secondary rounded w-full mb-2" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-4xl mb-4">⭐</p>
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
          <p className="text-muted text-sm mb-4">You haven&apos;t written any reviews. Book an event and share your experience!</p>
          <Link href="/events" className="text-primary hover:underline text-sm font-medium">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-card border border-border rounded-xl p-5">
              {editingId === review._id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    {renderStars(editForm.rating, true, n => setEditForm({ ...editForm, rating: n }))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Comment</label>
                    <textarea
                      rows={3}
                      value={editForm.comment}
                      onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(review._id)}
                      className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-secondary text-sm rounded-lg hover:bg-primary/10 transition"
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
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {review.eventTitle || 'View Event'}
                      </Link>
                      <h3 className="font-semibold mt-1">{review.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(review)}
                        className="px-3 py-1.5 text-xs bg-secondary rounded-lg hover:bg-primary/10 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="px-3 py-1.5 text-xs text-danger bg-red-50 rounded-lg hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted mt-2">{review.comment}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
