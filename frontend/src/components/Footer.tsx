'use client';

import Link from 'next/link';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              🎫 EventHub
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your one-stop platform for discovering, booking, and managing events. From concerts to conferences, we&apos;ve got you covered.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/events" className="hover:text-white transition">Browse Events</Link></li>
              <li><Link href="/events?category=music" className="hover:text-white transition">Music Events</Link></li>
              <li><Link href="/events?category=sports" className="hover:text-white transition">Sports Events</Link></li>
              <li><Link href="/events?category=conference" className="hover:text-white transition">Conferences</Link></li>
              <li><Link href="/events?category=workshop" className="hover:text-white transition">Workshops</Link></li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Organizers</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/register" className="hover:text-white transition">Create Account</Link></li>
              <li><Link href="/organizer/events/create" className="hover:text-white transition">Create Event</Link></li>
              <li><Link href="/organizer/events" className="hover:text-white transition">Manage Events</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>support@eventhub.com</span>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>+94 11 234 5678</span>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Colombo, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="hover:text-gray-300 cursor-default">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-default">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
