'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiGrid, FiUsers, FiCalendar, FiCreditCard, FiLayers, FiShield, FiUserX } from 'react-icons/fi';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: FiGrid },
  { label: 'Users', href: '/admin/users', icon: FiUsers },
  { label: 'Bookings', href: '/admin/bookings', icon: FiCalendar },
  { label: 'Payments', href: '/admin/payments', icon: FiCreditCard },
  { label: 'Events', href: '/admin/events', icon: FiLayers },
];

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchUsers();
  }, [user, authLoading, page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      params.set('page', page.toString());
      params.set('limit', '15');
      const data = await usersApi.getAllUsers(params.toString());
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await usersApi.updateUserRole(userId, newRole);
      toast.success('Role updated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await usersApi.deactivateUser(userId);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate');
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
          <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
          <p className="text-blue-200">View and manage platform users</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex gap-1 flex-wrap">
          {adminNav.map(item => {
            const Icon = item.icon;
            const active = item.href === '/admin/users';
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
          {['', 'customer', 'organizer', 'admin'].map(role => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                roleFilter === role ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {role || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl" />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-4 font-medium text-gray-500">Name</th>
                  <th className="text-left px-5 py-4 font-medium text-gray-500">Email</th>
                  <th className="text-left px-5 py-4 font-medium text-gray-500">Role</th>
                  <th className="text-left px-5 py-4 font-medium text-gray-500">Status</th>
                  <th className="text-right px-5 py-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{u.email}</td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      >
                        <option value="customer">Customer</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.isActive && u._id !== user.id && (
                        <button
                          onClick={() => handleDeactivate(u._id)}
                          className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                        >
                          <FiUserX className="w-3.5 h-3.5" />
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
