'use client';

// EventHub Home Page
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.getAll('limit=6&sortBy=newest')
      .then(d => setFeatured(d.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
              Discover & Book Amazing Events
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-8">
              From concerts and sports to conferences and workshops — find your next unforgettable experience.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/events"
                className="px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition"
              >
                Browse Events
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Latest Events</h2>
          <Link href="/events" className="text-primary font-medium hover:underline">
            View all →
          </Link>
        </div>

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
        ) : featured.length === 0 ? (
          <p className="text-center text-muted py-12">No events available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((event) => (
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
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                      Sold Out
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition mb-2 line-clamp-1">
                  {event.title}
                </h3>
                <p className="text-sm text-muted mb-4 line-clamp-2">
                  {event.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted">
                    📅 {formatDate(event.date)}
                  </div>
                  <div className="font-semibold text-primary">
                    {formatCurrency(event.ticketPrice)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted">
                  📍 {event.venue}
                </div>
                {event.averageRating > 0 && (
                  <div className="mt-2 text-xs text-warning flex items-center gap-1">
                    ⭐ {event.averageRating.toFixed(1)} ({event.totalReviews} reviews)
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-secondary/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Why choose mm us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🔒', title: 'Secure Booking', desc: 'SAGA-pattern transactions ensure your bookings are always consistent and reliable.' },
              { icon: '⚡', title: 'Real-time Updates', desc: 'Get instant notifications about your bookings, payments, and event updates.' },
              { icon: '📊', title: 'Smart Insights', desc: 'Organizers get detailed analytics and reports to manage their events effectively.' },
            ].map((f, i) => (
              <div key={i} className="bg-card p-6 rounded-xl border border-border text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
