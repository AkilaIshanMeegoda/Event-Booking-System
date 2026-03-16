'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    reportsApi.getDashboard()
      .then(d => setDashboard(d.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      {/* Navigation */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { label: 'Dashboard', href: '/admin', active: true },
          { label: 'Users', href: '/admin/users', active: false },
          { label: 'All Bookings', href: '/admin/bookings', active: false },
          { label: 'Payments', href: '/admin/payments', active: false },
          { label: 'All Events', href: '/admin/events', active: false },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              item.active ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
              <div className="h-4 bg-secondary rounded w-1/2 mb-3" />
              <div className="h-8 bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : dashboard ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-sm text-muted mb-1">Total Events</p>
              <p className="text-3xl font-bold text-primary">{dashboard.totalEvents || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-sm text-muted mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-success">{formatCurrency(dashboard.revenue?.totalRevenue || 0)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-sm text-muted mb-1">Transactions</p>
              <p className="text-3xl font-bold text-accent">{dashboard.revenue?.totalTransactions || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-sm text-muted mb-1">Avg. Transaction</p>
              <p className="text-3xl font-bold text-warning">{formatCurrency(dashboard.revenue?.avgAmount || 0)}</p>
            </div>
          </div>

          {/* Daily Revenue */}
          {dashboard.dailyRevenue?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Revenue</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted font-medium">Date</th>
                      <th className="text-right py-2 text-muted font-medium">Revenue</th>
                      <th className="text-right py-2 text-muted font-medium">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.dailyRevenue.slice(0, 14).map((d: any) => (
                      <tr key={d._id} className="border-b border-border/50">
                        <td className="py-2">{d._id}</td>
                        <td className="py-2 text-right font-medium text-success">{formatCurrency(d.dailyRevenue)}</td>
                        <td className="py-2 text-right">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted">Failed to load dashboard data.</p>
      )}
    </div>
  );
}
