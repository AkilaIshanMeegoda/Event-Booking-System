'use client';

// EventHub Home Page
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { eventsApi } from '@/lib/api';
import { formatDate, formatCurrency, getCategoryColor, getCategoryGradient, getCategoryEmoji } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { FiSearch, FiCalendar, FiMapPin, FiArrowRight, FiMusic, FiTarget, FiMonitor, FiFilm, FiTool, FiSun, FiUsers, FiCreditCard, FiSmile, FiShield, FiZap, FiTrendingUp } from 'react-icons/fi';

const CATEGORY_DATA = [
  { key: 'music', label: 'Music', icon: FiMusic, gradient: 'from-purple-500 to-pink-500' },
  { key: 'concert', label: 'Concerts', icon: FiMusic, gradient: 'from-blue-500 to-purple-500' },
  { key: 'sports', label: 'Sports', icon: FiTarget, gradient: 'from-green-500 to-emerald-500' },
  { key: 'conference', label: 'Conferences', icon: FiMonitor, gradient: 'from-blue-500 to-cyan-500' },
  { key: 'theater', label: 'Theater', icon: FiFilm, gradient: 'from-red-500 to-orange-500' },
  { key: 'workshop', label: 'Workshops', icon: FiTool, gradient: 'from-amber-500 to-yellow-500' },
  { key: 'festival', label: 'Festivals', icon: FiSun, gradient: 'from-pink-500 to-rose-500' },
  { key: 'meetup', label: 'Meetups', icon: FiUsers, gradient: 'from-teal-500 to-cyan-500' },
];

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    eventsApi.getAll('limit=6&sortBy=newest')
      .then(d => setFeatured(d.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ───── Hero Section ───── */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/home.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-900/80" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in-up">
              <FiZap className="w-4 h-4" />
              <span>The #1 Event Booking Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up delay-100">
              Discover &amp; Book{' '}
              <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                Amazing Events
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              From concerts and sports to conferences and workshops — find and book your next unforgettable experience with just a few clicks.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/events${searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery)}` : ''}`;
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-12 animate-fade-in-up delay-300"
            >
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, venues, categories..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg text-base"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                Search Events
              </button>
            </form>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-16 animate-fade-in-up delay-400">
              {[
                { value: '1,000+', label: 'Events' },
                { value: '50,000+', label: 'Tickets Sold' },
                { value: '5,000+', label: 'Happy Customers' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 73.3C480 67 600 73 720 80C840 87 960 93 1080 90C1200 87 1320 73 1380 66.7L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ───── Browse by Category ───── */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Explore events across all categories and find the perfect experience for you</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORY_DATA.map((cat) => (
            <Link
              key={cat.key}
              href={`/events?category=${cat.key}`}
              className="group relative overflow-hidden rounded-2xl p-6 sm:p-8 text-center transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10">
                <cat.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white mx-auto mb-3" />
                <h3 className="text-white font-semibold text-base sm:text-lg">{cat.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── Featured Events ───── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Trending Events</h2>
              <p className="text-gray-500">Don&apos;t miss out on the hottest events happening now</p>
            </div>
            <Link href="/events" className="hidden sm:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition">
              View All <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          ) : featured.length === 0 ? (
            <p className="text-center text-gray-500 py-16 text-lg">No events available yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((event) => (
                <Link
                  key={event._id}
                  href={`/events/${event._id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Event Image */}
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
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </div>
                    {event.availableTickets === 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs px-3 py-1 rounded-full bg-red-500 text-white font-semibold">Sold Out</span>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition mb-2 line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="w-4 h-4 text-blue-500" />
                        {formatDate(event.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                      <FiMapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="line-clamp-1">{event.venue}{event.location ? `, ${event.location}` : ''}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xl font-bold text-blue-600">{formatCurrency(event.ticketPrice)}</div>
                      {event.averageRating > 0 && (
                        <div className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                          ⭐ {event.averageRating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link href="/events" className="sm:hidden flex items-center justify-center gap-2 text-blue-600 font-semibold mt-8 hover:text-blue-700 transition">
            View All Events <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Book your next event in three simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: FiSearch, step: '01', title: 'Discover Events', desc: 'Browse through thousands of events. Filter by category, date, location, or price to find the perfect event for you.', color: 'from-blue-600 to-blue-400' },
            { icon: FiCreditCard, step: '02', title: 'Book Securely', desc: 'Select your tickets and pay securely with Stripe. Get instant confirmation and e-tickets sent to your email.', color: 'from-blue-500 to-cyan-500' },
            { icon: FiSmile, step: '03', title: 'Enjoy the Event', desc: 'Show up and have an amazing time! After the event, share your experience by leaving a review.', color: 'from-cyan-500 to-blue-400' },
          ].map((item, i) => (
            <div key={i} className="relative text-center group">
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
              )}
              <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-10 h-10 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-700 shadow-md">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Why Choose Us ───── */}
      <section className="bg-gray-900 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose EventHub?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">We provide everything you need for a seamless event booking experience</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FiShield, title: 'Secure Payments', desc: 'All transactions are processed through Stripe with bank-grade encryption and security.', color: 'text-emerald-400' },
              { icon: FiZap, title: 'Instant Confirmation', desc: 'Get immediate booking confirmations and real-time notifications about your events.', color: 'text-yellow-400' },
              { icon: FiTrendingUp, title: 'Organizer Analytics', desc: 'Event organizers get detailed insights, revenue reports, and booking analytics.', color: 'text-blue-400' },
              { icon: FiUsers, title: 'Community Reviews', desc: 'Read authentic reviews from other attendees and share your own experiences.', color: 'text-purple-400' },
              { icon: FiCalendar, title: 'Easy Management', desc: 'Manage all your bookings in one place. Cancel, review or check event details anytime.', color: 'text-pink-400' },
              { icon: FiMapPin, title: 'Events Everywhere', desc: 'Find events happening in your area or discover exciting events in new destinations.', color: 'text-cyan-400' },
            ].map((f, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition group">
                <f.icon className={`w-8 h-8 ${f.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Whether you&apos;re looking for your next adventure or want to organize an event, EventHub has you covered.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/events"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl"
            >
              Browse Events
            </Link>
            {!user ? (
              <Link
                href="/register"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-xl transition shadow-lg hover:shadow-xl border border-blue-100"
              >
                Create an Account
              </Link>
            ) : user.role === 'organizer' || user.role === 'admin' ? (
              <Link
                href="/organizer/events/create"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-xl transition shadow-lg hover:shadow-xl border border-blue-100"
              >
                Create an Event
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
