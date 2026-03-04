'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { notificationsApi } from '@/lib/api';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
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
  };

  const isActive = (path: string) => pathname === path;

  if (loading) return null;

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-primary">
              🎫 EventHub
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/events"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/events') ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                }`}
              >
                Events
              </Link>
              {user && (
                <>
                  <Link
                    href="/bookings"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive('/bookings') ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/reviews"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive('/reviews') ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    My Reviews
                  </Link>
                  <Link
                    href="/notifications"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition relative ${
                      isActive('/notifications') ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    Notifications
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-danger text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {user?.role === 'organizer' && (
                <Link
                  href="/organizer/events"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname.startsWith('/organizer') ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  My Events
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname.startsWith('/admin') ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition"
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize hidden sm:block">
                    {user.role}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-secondary"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-2 text-sm hover:bg-secondary md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-sm hover:bg-secondary md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      Notifications {unread > 0 && `(${unread})`}
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
