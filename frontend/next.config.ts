import type { NextConfig } from "next";

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';
const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:5002';
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5003';
const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:5004';
const reviewServiceUrl = process.env.REVIEW_SERVICE_URL || 'http://localhost:5005';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';
const reportingServiceUrl = process.env.REPORTING_SERVICE_URL || 'http://localhost:5007';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: `${userServiceUrl}/api/auth/:path*` },
      { source: '/api/users/:path*', destination: `${userServiceUrl}/api/users/:path*` },
      { source: '/api/events/:path*', destination: `${eventServiceUrl}/api/events/:path*` },
      { source: '/api/payments/:path*', destination: `${paymentServiceUrl}/api/payments/:path*` },
      { source: '/api/bookings/:path*', destination: `${bookingServiceUrl}/api/bookings/:path*` },
      { source: '/api/reviews/:path*', destination: `${reviewServiceUrl}/api/reviews/:path*` },
      { source: '/api/notifications/:path*', destination: `${notificationServiceUrl}/api/notifications/:path*` },
      { source: '/api/reports/:path*', destination: `${reportingServiceUrl}/api/reports/:path*` },
    ];
  },
};

export default nextConfig;
