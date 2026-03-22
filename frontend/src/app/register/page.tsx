'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiArrowRight, FiUsers } from 'react-icons/fi';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'customer' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Registration successful!');
      router.push('/events');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl font-bold mb-4">Join EventHub Today</h2>
          <p className="text-lg text-white/80 leading-relaxed mb-8">
            Create your free account and unlock a world of amazing events and experiences.
          </p>
          <div className="space-y-4">
            {[
              'Discover events tailored to your interests',
              'Secure booking with instant confirmation',
              'Create & manage your own events as organizer',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-blue-600 inline-block mb-2">🎫 EventHub</Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500">Join thousands of event enthusiasts</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">I want to</label>
                <div className="relative">
                  <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition appearance-none"
                  >
                    <option value="customer">Book Events (Customer)</option>
                    <option value="organizer">Create Events (Organizer)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Account <FiArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
