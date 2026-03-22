'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiGrid, FiUsers, FiCalendar, FiCreditCard, FiLayers, FiXCircle } from 'react-icons/fi';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: FiGrid },
  { label: 'Users', href: '/admin/users', icon: FiUsers },
  { label: 'Bookings', href: '/admin/bookings', icon: FiCalendar },
  { label: 'Payments', href: '/admin/payments', icon: FiCreditCard },
  { label: 'Events', href: '/admin/events', icon: FiLayers },
];

export default function AdminBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchBookings();
  }, [user, authLoading, page, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '15');
      const data = await bookingsApi.getAll(params.toString());
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingsApi.cancel(id, 'Cancelled by admin');
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
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
          <h1 className="text-3xl font-bold mb-2">All Bookings</h1>
          <p className="text-blue-200">Monitor and manage all platform bookings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex gap-1 flex-wrap">
          {adminNav.map(item => {
            const Icon = item.icon;
            const active = item.href === '/admin/bookings';
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
          {['', 'confirmed', 'cancelled', 'failed'].map(status => (
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
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg font-semibold text-gray-800 mb-1">No bookings found</p>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Event</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">User Email</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Tickets</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Status</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Payment</th>
                    <th className="text-left px-5 py-4 font-medium text-gray-500">Date</th>
                    <th className="text-right px-5 py-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                      <td className="px-5 py-4 font-medium max-w-[200px] truncate">{b.eventTitle}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{b.userEmail || b.userId}</td>
                      <td className="px-5 py-4">{b.ticketCount}</td>
                      <td className="px-5 py-4 text-blue-600 font-semibold">{formatCurrency(b.totalAmount)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize ${getStatusColor(b.status)}`}>{b.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize ${getStatusColor(b.paymentStatus)}`}>{b.paymentStatus}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{formatDate(b.bookingDate)}</td>
                      <td className="px-5 py-4 text-right">
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleCancel(b._id)}
                            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                            <FiXCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </td>
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
