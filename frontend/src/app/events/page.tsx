'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor } from '@/lib/utils';

const CATEGORIES = ['all', 'music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other'];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      params.set('sortBy', sortBy);
      params.set('page', page.toString());
      params.set('limit', '12');
      const data = await eventsApi.getAll(params.toString());
      setEvents(data.events);
      setPagination(data.pagination);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, sortBy, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Events</h1>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition capitalize ${
                  category === cat
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground/70 hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="ml-auto px-3 py-1.5 rounded-lg border border-border bg-white text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
              <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
              <div className="h-6 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-4 bg-secondary rounded w-full mb-4" />
              <div className="h-4 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted mb-2">No events found</p>
          <p className="text-sm text-muted">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                  {event.availableTickets === 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">Sold Out</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition mb-2 line-clamp-1">
                  {event.title}
                </h3>
                <p className="text-sm text-muted mb-4 line-clamp-2">{event.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">📅 {formatDate(event.date)}</span>
                  <span className="font-semibold text-primary">{formatCurrency(event.ticketPrice)}</span>
                </div>
                <div className="mt-2 text-xs text-muted">📍 {event.venue}, {event.location}</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    🎟️ {event.availableTickets}/{event.totalTickets} available
                  </span>
                  {event.averageRating > 0 && (
                    <span className="text-warning">⭐ {event.averageRating.toFixed(1)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-secondary disabled:opacity-50 transition text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-muted px-4">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 rounded-lg border border-border bg-white hover:bg-secondary disabled:opacity-50 transition text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
