'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CATEGORIES = ['music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other'];

export default function CreateEventPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      toast.error('Only organizers can create events');
      return;
    }
    // Validations
    if (form.title.trim().length < 3) { toast.error('Title must be at least 3 characters'); return; }
    if (form.description.trim().length < 10) { toast.error('Description must be at least 10 characters'); return; }
    if (form.venue.trim().length < 2) { toast.error('Venue is required'); return; }
    if (form.location.trim().length < 2) { toast.error('Location is required'); return; }
    if (form.totalTickets < 1) { toast.error('Total tickets must be at least 1'); return; }
    if (form.ticketPrice < 0) { toast.error('Ticket price cannot be negative'); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!form.date || new Date(form.date) < today) { toast.error('Event date must be today or in the future'); return; }
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.imageUrl) delete payload.imageUrl;
      const data = await eventsApi.create(payload);
      toast.success('Event created successfully!');
      router.push(`/events/${data.event._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-muted">Only organizers can create events.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/organizer/events" className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Back to My Events
      </Link>
      <h1 className="text-2xl font-bold mb-8">Create New Event</h1>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Event Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            placeholder="e.g., Summer Music Festival 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none"
            placeholder="Describe your event..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 capitalize"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input
              type="time"
              required
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Venue</label>
            <input
              type="text"
              required
              value={form.venue}
              onChange={e => setForm({ ...form, venue: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g., Convention Center"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            required
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g., New York, USA"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Total Tickets</label>
            <input
              type="number"
              required
              min={1}
              value={form.totalTickets}
              onChange={e => setForm({ ...form, totalTickets: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ticket Price (USD)</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.ticketPrice}
              onChange={e => setForm({ ...form, ticketPrice: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
