'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor, getCategoryGradient, getCategoryEmoji } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiGrid, FiUsers, FiCalendar, FiCreditCard, FiLayers, FiPlus, FiEdit3, FiTrash2, FiBarChart2, FiMapPin, FiTag, FiStar } from 'react-icons/fi';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: FiGrid },
  { label: 'Users', href: '/admin/users', icon: FiUsers },
  { label: 'Bookings', href: '/admin/bookings', icon: FiCalendar },
  { label: 'Payments', href: '/admin/payments', icon: FiCreditCard },
  { label: 'Events', href: '/admin/events', icon: FiLayers },
];

export default function AdminEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

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

  const openEdit = (event: any) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title || '',
      category: event.category || '',
      date: event.date ? event.date.split('T')[0] : '',
      time: event.time || '',
      venue: event.venue || '',
      location: event.location || '',
      ticketPrice: event.ticketPrice ?? '',
      totalTickets: event.totalTickets ?? '',
      description: event.description || '',
      imageUrl: event.imageUrl || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    // Validations
    if (!editForm.title?.trim() || editForm.title.trim().length < 3) { toast.error('Title must be at least 3 characters'); return; }
    if (!editForm.description?.trim() || editForm.description.trim().length < 10) { toast.error('Description must be at least 10 characters'); return; }
    if (Number(editForm.totalTickets) < 1) { toast.error('Total tickets must be at least 1'); return; }
    if (Number(editForm.ticketPrice) < 0) { toast.error('Ticket price cannot be negative'); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!editForm.date || new Date(editForm.date) < today) { toast.error('Event date must be today or in the future'); return; }
    setSavingEdit(true);
    try {
      const payload: any = {
        ...editForm,
        ticketPrice: Number(editForm.ticketPrice),
        totalTickets: Number(editForm.totalTickets),
      };
      if (!payload.imageUrl) delete payload.imageUrl;
      await eventsApi.update(editingEvent._id, payload);
      toast.success('Event updated');
      setEditingEvent(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSavingEdit(false);
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-16">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">All Events</h1>
              <p className="text-blue-200">Manage all platform events</p>
            </div>
            <Link href="/organizer/events/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/30 transition border border-white/30">
              <FiPlus className="w-4 h-4" />
              Create Event
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex gap-1 flex-wrap">
          {adminNav.map(item => {
            const Icon = item.icon;
            const active = item.href === '/admin/events';
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other'].map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                category === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {cat || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-3">🎭</p>
            <p className="text-lg font-semibold text-gray-800 mb-1">No events found</p>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="flex">
                  {/* Image / Gradient Thumbnail */}
                  <div className="w-32 sm:w-40 shrink-0 relative">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full ${getCategoryGradient(event.category)} flex items-center justify-center`}>
                        <span className="text-3xl">{getCategoryEmoji(event.category)}</span>
                      </div>
                    )}
                    {!event.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-lg">Deleted</span>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-5 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                      </div>
                      <Link href={`/events/${event._id}`} className="text-lg font-semibold hover:text-blue-600 transition line-clamp-1">
                        {event.title}
                      </Link>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5 text-blue-500" />{formatDate(event.date)}</span>
                        <span className="flex items-center gap-1.5"><FiMapPin className="w-3.5 h-3.5 text-blue-500" />{event.venue}</span>
                        <span className="flex items-center gap-1.5"><FiTag className="w-3.5 h-3.5 text-blue-500" />{formatCurrency(event.ticketPrice)}</span>
                        <span className="flex items-center gap-1.5"><FiUsers className="w-3.5 h-3.5 text-blue-500" />{event.availableTickets}/{event.totalTickets}</span>
                        {event.averageRating > 0 && <span className="flex items-center gap-1.5"><FiStar className="w-3.5 h-3.5 text-amber-500" />{event.averageRating.toFixed(1)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/admin/reports/${event._id}`}
                        className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Report">
                        <FiBarChart2 className="w-4 h-4" />
                      </Link>
                      {event.isActive && (
                        <>
                          <button onClick={() => openEdit(event)}
                            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Edit">
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(event._id)}
                            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pb-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition">
                  Previous
                </button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition ${page === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" required value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select required value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm">
                  {['music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="text" required value={editForm.time}
                    onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                    placeholder="e.g. 7:00 PM"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input type="text" required value={editForm.venue}
                  onChange={e => setEditForm({ ...editForm, venue: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" required value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
                  <input type="number" required min="0" step="0.01" value={editForm.ticketPrice}
                    onChange={e => setEditForm({ ...editForm, ticketPrice: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Tickets</label>
                  <input type="number" required min="1" value={editForm.totalTickets}
                    onChange={e => setEditForm({ ...editForm, totalTickets: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required rows={3} value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                <input type="url" value={editForm.imageUrl}
                  onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingEdit}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingEvent(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
