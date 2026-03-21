'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchEvents();
  }, [user, authLoading, page, category]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      params.set('page', page.toString());
      params.set('limit', '15');
      const data = await eventsApi.getAll(params.toString());
      setEvents(data.events);
      setPagination(data.pagination);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventsApi.delete(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">All Events</h1>
        <Link href="/organizer/events/create"
          className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition">
          + Create Event
        </Link>
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: 'All Bookings', href: '/admin/bookings' },
          { label: 'Payments', href: '/admin/payments' },
          { label: 'All Events', href: '/admin/events', active: true },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${item.active ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'}`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other'].map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${category === cat ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'}`}>
            {cat || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded" />)}
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-muted py-12">No events found</p>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    {!event.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Deleted</span>
                    )}
                  </div>
                  <Link href={`/events/${event._id}`} className="text-lg font-semibold hover:text-primary transition">
                    {event.title}
                  </Link>
                  <div className="flex flex-wrap gap-4 text-sm text-muted mt-1">
                    <span>📅 {formatDate(event.date)}</span>
                    <span>📍 {event.venue}</span>
                    <span>💰 {formatCurrency(event.ticketPrice)}</span>
                    <span>🎟️ {event.availableTickets}/{event.totalTickets}</span>
                    {event.averageRating > 0 && <span>⭐ {event.averageRating.toFixed(1)}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/admin/reports/${event._id}`}
                    className="px-3 py-1.5 text-sm bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition">
                    Report
                  </Link>
                  {event.isActive && (
                    <button onClick={() => handleDelete(event._id)}
                      className="px-3 py-1.5 text-sm text-danger bg-red-50 rounded-lg hover:bg-red-100 transition">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">Previous</button>
              <span className="text-sm text-muted">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
