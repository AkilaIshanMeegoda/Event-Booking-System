'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { reportsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-secondary rounded w-1/2" />
        <div className="h-64 bg-secondary rounded" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-muted mb-4">Report not available</p>
        <Link href="/admin/events" className="text-primary hover:underline">← Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin/events" className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Back to Events
      </Link>

      <h1 className="text-2xl font-bold mb-2">{report.eventTitle}</h1>
      <p className="text-sm text-muted mb-8">Event Report • Generated {formatDate(report.generatedAt)}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Category', value: report.category, icon: '🏷️' },
          { label: 'Event Date', value: formatDate(report.date), icon: '📅' },
          { label: 'Venue', value: report.venue, icon: '📍' },
          { label: 'Tickets Sold', value: `${report.ticketsSold} / ${report.totalTickets}`, icon: '🎟️' },
          { label: 'Available', value: report.availableTickets, icon: '✅' },
          { label: 'Occupancy', value: `${(report.occupancyRate || 0).toFixed(1)}%`, icon: '📊' },
          { label: 'Revenue', value: formatCurrency(report.revenue || 0), icon: '💰' },
          { label: 'Avg. Rating', value: report.averageRating ? `${report.averageRating.toFixed(1)} ⭐` : 'N/A', icon: '⭐' },
          { label: 'Total Reviews', value: report.totalReviews || 0, icon: '💬' },
          { label: 'Total Bookings', value: report.totalBookings || 0, icon: '📋' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">{stat.icon} {stat.label}</p>
            <p className="font-semibold text-lg capitalize">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Occupancy Bar */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-medium mb-3">Ticket Occupancy</h3>
        <div className="w-full bg-border rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              (report.occupancyRate || 0) > 80 ? 'bg-danger' : (report.occupancyRate || 0) > 50 ? 'bg-warning' : 'bg-success'
            }`}
            style={{ width: `${Math.min(100, report.occupancyRate || 0)}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {report.ticketsSold} of {report.totalTickets} tickets sold ({(report.occupancyRate || 0).toFixed(1)}%)
        </p>
      </div>
    </div>
  );
}
