'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor, getCategoryGradient, getCategoryEmoji } from '@/lib/utils';
import { FiSearch, FiCalendar, FiMapPin, FiFilter } from 'react-icons/fi';

const CATEGORIES = ['all', 'music', 'concert', 'sports', 'conference', 'theater', 'workshop', 'festival', 'meetup', 'other'];

function EventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Browse Events</h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">Find and book your next unforgettable experience</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Search & Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events, venues, locations..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition text-base"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <FiFilter className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-2 flex-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition capitalize cursor-pointer ${
                    category === cat
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No events found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{pagination.total || events.length} event{events.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              {events.map((event) => (
                <Link
                  key={event._id}
                  href={`/events/${event._id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(event.category)} flex items-center justify-center`}>
                        <span className="text-6xl opacity-30">{getCategoryEmoji(event.category)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                      {event.availableTickets === 0 && (
                        <span className="text-xs px-3 py-1 rounded-full bg-red-500 text-white font-semibold">Sold Out</span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition mb-2 line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>

                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="line-clamp-1">{event.venue}, {event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xl font-bold text-blue-600">{formatCurrency(event.ticketPrice)}</div>
                      <div className="flex items-center gap-3">
                        {event.averageRating > 0 && (
                          <span className="text-sm text-amber-500 font-medium">⭐ {event.averageRating.toFixed(1)}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          🎟️ {event.availableTickets}/{event.totalTickets}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-3 py-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium cursor-pointer"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p > pagination.pages || p < 1) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition cursor-pointer ${
                          p === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}
