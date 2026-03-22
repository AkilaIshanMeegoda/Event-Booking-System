'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiShield, FiAlertTriangle } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setForm({ name: user.name, email: user.email });
  }, [user, authLoading, router]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.updateProfile(form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action cannot be easily undone.')) return;
    setDeactivating(true);
    try {
      await usersApi.deactivateAccount();
      toast.success('Account deactivated');
      logout();
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate');
    } finally {
      setDeactivating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-blue-100 mt-1">Manage your account settings</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 capitalize mt-1.5 inline-flex items-center gap-1 font-semibold">
                  <FiShield className="w-3 h-3" /> {user.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Once you deactivate your account, you will not be able to log in.
          </p>
          <button
            onClick={handleDeactivate}
            disabled={deactivating}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 text-sm font-semibold"
          >
            {deactivating ? 'Deactivating...' : 'Deactivate Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
