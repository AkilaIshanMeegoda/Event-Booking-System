'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor, getCategoryGradient, getCategoryEmoji } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiPlus, FiCalendar, FiClock, FiMapPin, FiEdit3, FiEye, FiTrash2, FiStar, FiUsers } from 'react-icons/fi';

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white">My Events</h1>
            <p className="text-blue-100 mt-1">Create and manage your events</p>
          </div>
          <Link
            href="/organizer/events/create"
            className="px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition shadow-sm flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Create Event
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-6 shadow-sm">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">🎪</div>
            <p className="text-xl font-bold text-gray-900 mb-2">No events created yet</p>
            <p className="text-gray-500 mb-6">Start by creating your first event!</p>
            <Link href="/organizer/events/create" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
              <FiPlus className="w-4 h-4" /> Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="flex">
                  {/* Event Image/Gradient */}
                  <div className="hidden sm:block w-40 shrink-0">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(event.category)} flex items-center justify-center`}>
                        <span className="text-4xl opacity-40">{getCategoryEmoji(event.category)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                          {!event.isActive && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">Inactive</span>
                          )}
                        </div>
                        <Link
                          href={`/events/${event._id}`}
                          className="text-lg font-bold text-gray-900 hover:text-blue-600 transition"
                        >
                          {event.title}
                        </Link>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5 text-blue-500" /> {formatDate(event.date)}</span>
                          <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5 text-blue-500" /> {event.time}</span>
                          <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5 text-blue-500" /> {event.venue}</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(event.ticketPrice)}</span>
                          <span className="flex items-center gap-1"><FiUsers className="w-3.5 h-3.5 text-blue-500" /> {event.availableTickets}/{event.totalTickets}</span>
                          {event.averageRating > 0 && <span className="flex items-center gap-1"><FiStar className="w-3.5 h-3.5 text-amber-400" /> {event.averageRating.toFixed(1)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Link
                        href={`/organizer/events/${event._id}/edit`}
                        className="px-3.5 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition flex items-center gap-1.5"
                      >
                        <FiEdit3 className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <Link
                        href={`/events/${event._id}`}
                        className="px-3.5 py-2 text-sm font-medium bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition flex items-center gap-1.5"
                      >
                        <FiEye className="w-3.5 h-3.5" /> View
                      </Link>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="px-3.5 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition flex items-center gap-1.5"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
