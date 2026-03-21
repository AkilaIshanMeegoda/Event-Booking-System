'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { paymentsApi } from '@/lib/api';
import { formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils';

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Payments</h1>

      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: 'All Bookings', href: '/admin/bookings' },
          { label: 'Payments', href: '/admin/payments', active: true },
          { label: 'All Events', href: '/admin/events' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${item.active ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'}`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'completed', 'pending', 'failed', 'refunded'].map(status => (
          <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${statusFilter === status ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'}`}>
            {status || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded" />)}
        </div>
      ) : payments.length === 0 ? (
        <p className="text-center text-muted py-12">No payments found</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted">Transaction ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.transactionId}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{p.eventTitle || '-'}</td>
                    <td className="px-4 py-3 font-medium text-primary">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-border">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">Previous</button>
              <span className="text-sm text-muted">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="px-3 py-1.5 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
