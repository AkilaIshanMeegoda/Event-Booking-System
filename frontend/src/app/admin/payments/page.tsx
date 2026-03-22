'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { paymentsApi } from '@/lib/api';
import { formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils';
import { FiGrid, FiUsers, FiCalendar, FiCreditCard, FiLayers } from 'react-icons/fi';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: FiGrid },
  { label: 'Users', href: '/admin/users', icon: FiUsers },
  { label: 'Bookings', href: '/admin/bookings', icon: FiCalendar },
  { label: 'Payments', href: '/admin/payments', icon: FiCreditCard },
  { label: 'Events', href: '/admin/events', icon: FiLayers },
];

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchPayments();
  }, [user, authLoading, page, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '15');
      const data = await paymentsApi.getAll(params.toString());
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Payments</h1>
          <p className="text-blue-200">Track all payment transactions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex gap-1 flex-wrap">
          {adminNav.map(item => {
            const Icon = item.icon;
            const active = item.href === '/admin/payments';
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

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'completed', 'failed', 'refunded'].map(status => (
            <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                statusFilter === status ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {status || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-lg font-semibold text-gray-800 mb-1">No payments found</p>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Transaction ID</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Event</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Status</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Refunded At</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Refund Ref</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Method</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-gray-600">{p.transactionId}</td>
                      <td className="px-5 py-4 max-w-50 truncate font-medium">{p.eventTitle || '-'}</td>
                      <td className="px-5 py-4 font-semibold text-blue-600">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize ${getStatusColor(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{p.refundedAt ? formatDateTime(p.refundedAt) : '-'}</td>
                      <td className="px-5 py-4 text-gray-500 font-mono text-xs">{p.stripeRefundId || '-'}</td>
                      <td className="px-5 py-4 text-gray-500 capitalize">{p.paymentMethod}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{formatDateTime(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition">
                  Previous
                </button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition ${page === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
