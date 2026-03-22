'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { reportsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { FiArrowLeft, FiCalendar, FiMapPin, FiTag, FiUsers, FiStar, FiMessageSquare, FiList, FiTrendingUp, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';

export default function EventReportPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    if (!id) return;
    reportsApi.getEventReport(id as string)
      .then(d => setReport(d.report))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 h-40" />
        <div className="max-w-4xl mx-auto px-4 -mt-8 animate-pulse space-y-4">
          <div className="h-12 bg-white rounded-2xl w-1/2" />
          <div className="h-64 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 h-40" />
        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-xl font-semibold text-gray-800 mb-2">Report not available</p>
            <Link href="/admin/events" className="text-blue-600 hover:text-blue-700 font-medium">
              <span className="flex items-center justify-center gap-2"><FiArrowLeft className="w-4 h-4" /> Back to Events</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Category', value: report.category, icon: FiTag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Event Date', value: formatDate(report.date), icon: FiCalendar, color: 'bg-blue-50 text-blue-600' },
    { label: 'Venue', value: report.venue, icon: FiMapPin, color: 'bg-pink-50 text-pink-600' },
    { label: 'Tickets Sold', value: `${report.ticketsSold} / ${report.totalTickets}`, icon: FiUsers, color: 'bg-blue-50 text-blue-600' },
    { label: 'Available', value: report.availableTickets, icon: FiCheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Occupancy', value: `${(report.occupancyRate || 0).toFixed(1)}%`, icon: FiBarChart2, color: 'bg-amber-50 text-amber-600' },
    { label: 'Revenue', value: formatCurrency(report.revenue || 0), icon: FiTrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Avg. Rating', value: report.averageRating ? `${report.averageRating.toFixed(1)} / 5` : 'N/A', icon: FiStar, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Reviews', value: report.totalReviews || 0, icon: FiMessageSquare, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Bookings', value: report.totalBookings || 0, icon: FiList, color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
          <Link href="/admin/events" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-4 text-sm transition">
            <FiArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-bold mb-2">{report.eventTitle}</h1>
          <p className="text-blue-200">Event Report &bull; Generated {formatDate(report.generatedAt)}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                <p className="font-semibold text-gray-900 capitalize">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Occupancy Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold">Ticket Occupancy</h3>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (report.occupancyRate || 0) > 80 ? 'bg-red-500' : (report.occupancyRate || 0) > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, report.occupancyRate || 0)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {report.ticketsSold} of {report.totalTickets} tickets sold ({(report.occupancyRate || 0).toFixed(1)}%)
          </p>
        </div>
      </div>
    </div>
  );
}
