'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { eventsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CATEGORIES = ['music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other'];

export default function EditEventPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'music',
    date: '',
    time: '',
    venue: '',
    location: '',
    totalTickets: 100,
    ticketPrice: 25,
    imageUrl: '',
  });

  useEffect(() => {
    if (!id) return;
    eventsApi.getById(id as string)
      .then(d => {
        const e = d.event;
        setForm({
          title: e.title,
          description: e.description,
          category: e.category,
          date: e.date ? e.date.split('T')[0] : '',
          time: e.time,
          venue: e.venue,
          location: e.location,
          totalTickets: e.totalTickets,
          ticketPrice: e.ticketPrice,
          imageUrl: e.imageUrl || '',
        });
      })
      .catch(() => toast.error('Event not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validations
    if (form.title.trim().length < 3) { toast.error('Title must be at least 3 characters'); return; }
    if (form.description.trim().length < 10) { toast.error('Description must be at least 10 characters'); return; }
    if (form.venue.trim().length < 2) { toast.error('Venue is required'); return; }
    if (form.location.trim().length < 2) { toast.error('Location is required'); return; }
    if (form.totalTickets < 1) { toast.error('Total tickets must be at least 1'); return; }
    if (form.ticketPrice < 0) { toast.error('Ticket price cannot be negative'); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!form.date || new Date(form.date) < today) { toast.error('Event date must be today or in the future'); return; }
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.imageUrl) delete payload.imageUrl;
      await eventsApi.update(id as string, payload);
      toast.success('Event updated!');
      router.push('/organizer/events');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-secondary rounded w-1/3" />
        <div className="h-64 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/organizer/events" className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Back to My Events
      </Link>
      <h1 className="text-2xl font-bold mb-8">Edit Event</h1>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Event Title</label>
          <input type="text" required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea required rows={4} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white capitalize">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" required value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input type="time" required value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Venue</label>
            <input type="text" required value={form.venue}
              onChange={e => setForm({ ...form, venue: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input type="text" required value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Total Tickets</label>
            <input type="number" required min={1} value={form.totalTickets}
              onChange={e => setForm({ ...form, totalTickets: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ticket Price (USD)</label>
            <input type="number" required min={0} step={0.01} value={form.ticketPrice}
              onChange={e => setForm({ ...form, ticketPrice: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Event Image URL (optional)</label>
          <input type="url" value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="https://example.com/event-banner.jpg" />
          {form.imageUrl && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-border">
              <img
                src={form.imageUrl}
                alt="Event preview"
                className="w-full h-48 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, imageUrl: '' })}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          <p className="text-xs text-muted mt-1">Add an image URL to make your event stand out</p>
        </div>
        <button type="submit" disabled={saving}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
