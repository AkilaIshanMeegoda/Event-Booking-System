import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: 'http://localhost:5001/api/auth/:path*' },
      { source: '/api/users/:path*', destination: 'http://localhost:5001/api/users/:path*' },
      { source: '/api/events/:path*', destination: 'http://localhost:5002/api/events/:path*' },
      { source: '/api/payments/:path*', destination: 'http://localhost:5003/api/payments/:path*' },
      { source: '/api/bookings/:path*', destination: 'http://localhost:5004/api/bookings/:path*' },
      { source: '/api/reviews/:path*', destination: 'http://localhost:5005/api/reviews/:path*' },
      { source: '/api/notifications/:path*', destination: 'http://localhost:5006/api/notifications/:path*' },
      { source: '/api/reports/:path*', destination: 'http://localhost:5007/api/reports/:path*' },
    ];
  },
};

export default nextConfig;
