'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrganizerEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'organizer' && user.role !== 'admin') { router.push('/'); return; }
    eventsApi.getAll('limit=100')
      .then(d => {
        // Filter to only show organizer's own events
        const myEvents = d.events.filter((e: any) => e.organizerId === user.id);
        setEvents(myEvents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventsApi.delete(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      toast.success('Event deleted');
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Events</h1>
        <Link
          href="/organizer/events/create"
          className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition"
        >
          + Create Event
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
              <div className="h-5 bg-secondary rounded w-1/3 mb-3" />
              <div className="h-4 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted mb-4">No events created yet</p>
          <Link href="/organizer/events/create" className="text-primary font-medium hover:underline">
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event._id} className="bg-card border border-border rounded-xl p-6 hover:shadow-sm transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    {!event.isActive && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Inactive</span>
                    )}
                  </div>
                  <Link
                    href={`/events/${event._id}`}
                    className="text-lg font-semibold hover:text-primary transition"
                  >
                    {event.title}
                  </Link>
                  <div className="flex flex-wrap gap-4 text-sm text-muted mt-2">
                    <span>📅 {formatDate(event.date)}</span>
                    <span>🕐 {event.time}</span>
                    <span>📍 {event.venue}</span>
                    <span>💰 {formatCurrency(event.ticketPrice)}</span>
                    <span>🎟️ {event.availableTickets}/{event.totalTickets} available</span>
                    {event.averageRating > 0 && <span>⭐ {event.averageRating.toFixed(1)}</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Link
                  href={`/organizer/events/${event._id}/edit`}
                  className="px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-primary/10 transition"
                >
                  Edit
                </Link>
                <Link
                  href={`/events/${event._id}`}
                  className="px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-primary/10 transition"
                >
                  View
                </Link>
                {(user.role === 'admin' || user.role === 'organizer') && (
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="px-3 py-1.5 text-sm text-danger bg-red-50 rounded-lg hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
