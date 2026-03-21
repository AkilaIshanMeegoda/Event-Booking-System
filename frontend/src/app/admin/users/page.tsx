'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import toast from 'react-hot-toast';

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Manage Users</h1>

      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Users', href: '/admin/users', active: true },
          { label: 'All Bookings', href: '/admin/bookings' },
          { label: 'Payments', href: '/admin/payments' },
          { label: 'All Events', href: '/admin/events' },
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

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'customer', 'organizer', 'admin'].map(role => (
          <button
            key={role}
            onClick={() => { setRoleFilter(role); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${
              roleFilter === role ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary/10'
            }`}
          >
            {role || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded" />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                      className="px-2 py-1 rounded border border-border bg-white text-xs capitalize"
                    >
                      <option value="customer">Customer</option>
                      <option value="organizer">Organizer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.isActive && u._id !== user.id && (
                      <button
                        onClick={() => handleDeactivate(u._id)}
                        className="text-xs text-danger hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-border">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">
                Previous
              </button>
              <span className="text-sm text-muted">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="px-3 py-1.5 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 text-sm">
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
