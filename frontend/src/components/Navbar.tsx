'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { FiBell, FiCalendar, FiStar, FiGrid, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      notificationsApi.getMy('limit=1').then(d => setUnread(d.unreadCount)).catch(() => {});
      const interval = setInterval(() => {
        notificationsApi.getMy('limit=1').then(d => setUnread(d.unreadCount)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (path: string) => pathname.startsWith(path);

  if (loading) return null;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white border-b border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent flex items-center gap-1.5">
              🎫 EventHub
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/events"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/events') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Events
              </Link>
              {user && (
                <>
                  <Link
                    href="/bookings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActivePrefix('/bookings') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/reviews"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/reviews') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Reviews
                  </Link>
                  <Link
                    href="/notifications"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition relative ${
                      isActive('/notifications') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <FiBell className="w-4 h-4 inline mr-1" />
                    Notifications
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {user?.role === 'organizer' && (
                <Link
                  href="/organizer/events"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActivePrefix('/organizer') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  My Events
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActivePrefix('/admin') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize font-semibold">
                    {user.role}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiUser className="w-4 h-4 text-gray-400" /> Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiCalendar className="w-4 h-4 text-gray-400" /> My Bookings
                    </Link>
                    <Link
                      href="/notifications"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiBell className="w-4 h-4 text-gray-400" /> Notifications
                      {unread > 0 && <span className="ml-auto text-[10px] bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
                    </Link>
                    <hr className="my-1.5 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <FiLogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/events" className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${isActive('/events') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setMobileOpen(false)}>Events</Link>
            {user && (
              <>
                <Link href="/bookings" className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${isActivePrefix('/bookings') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setMobileOpen(false)}>My Bookings</Link>
                <Link href="/reviews" className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${isActive('/reviews') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setMobileOpen(false)}>My Reviews</Link>
                <Link href="/notifications" className={`block px-3 py-2.5 rounded-lg text-sm font-medium relative ${isActive('/notifications') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setMobileOpen(false)}>
                  Notifications {unread > 0 && <span className="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>}
                </Link>
                {user.role === 'organizer' && <Link href="/organizer/events" className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${isActivePrefix('/organizer') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setMobileOpen(false)}>My Events</Link>}
                {user.role === 'admin' && <Link href="/admin" className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${isActivePrefix('/admin') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setMobileOpen(false)}>Admin</Link>}
                <hr className="border-gray-100" />
                <Link href="/profile" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600">Sign Out</button>
              </>
            )}
            {!user && (
              <div className="pt-2 space-y-2">
                <Link href="/login" className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/register" className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
