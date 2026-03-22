'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { FiGrid, FiUsers, FiCalendar, FiCreditCard, FiLayers, FiTrendingUp, FiDollarSign, FiActivity, FiBarChart2 } from 'react-icons/fi';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: FiGrid },
  { label: 'Users', href: '/admin/users', icon: FiUsers },
  { label: 'Bookings', href: '/admin/bookings', icon: FiCalendar },
  { label: 'Payments', href: '/admin/payments', icon: FiCreditCard },
  { label: 'Events', href: '/admin/events', icon: FiLayers },
];

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-16">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-200">Overview of your platform performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex gap-1 flex-wrap">
          {adminNav.map(item => {
            const Icon = item.icon;
            const active = item.href === '/admin';
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : dashboard ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Events', value: dashboard.totalEvents || 0, icon: FiCalendar, color: 'bg-blue-50 text-blue-600', valueColor: 'text-blue-600' },
                { label: 'Total Revenue', value: formatCurrency(dashboard.revenue?.totalRevenue || 0), icon: FiDollarSign, color: 'bg-emerald-50 text-emerald-600', valueColor: 'text-emerald-600' },
                { label: 'Transactions', value: dashboard.revenue?.totalTransactions || 0, icon: FiActivity, color: 'bg-blue-50 text-blue-600', valueColor: 'text-blue-600' },
                { label: 'Avg. Transaction', value: formatCurrency(dashboard.revenue?.avgAmount || 0), icon: FiTrendingUp, color: 'bg-amber-50 text-amber-600', valueColor: 'text-amber-600' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Daily Revenue */}
            {dashboard.dailyRevenue?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FiBarChart2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold">Daily Revenue</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-gray-500 font-medium">Date</th>
                        <th className="text-right py-3 text-gray-500 font-medium">Revenue</th>
                        <th className="text-right py-3 text-gray-500 font-medium">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.dailyRevenue.slice(0, 14).map((d: any) => (
                        <tr key={d._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 font-medium">{d._id}</td>
                          <td className="py-3 text-right font-semibold text-emerald-600">{formatCurrency(d.dailyRevenue)}</td>
                          <td className="py-3 text-right text-gray-600">{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Failed to load dashboard data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
