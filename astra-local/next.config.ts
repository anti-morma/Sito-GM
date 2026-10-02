import type { NextConfig } from 'next';

// Files in /public carry no hash in their name. The star data is versioned by
// its query (?v=), so it can be kept for a year; films and previews for a
// week, then quietly refreshed in the background.
const WEEK = 'public, max-age=604800, stale-while-revalidate=86400';

const nextConfig: NextConfig = {
  devIndicators: false,
  agentRules: false,
  poweredByHeader: false,
  // The two city pages became one (app/dove-lavoriamo): old links still arrive.
  async redirects() {
    return [
      { source: '/torino', destination: '/dove-lavoriamo', permanent: true },
      { source: '/taranto', destination: '/dove-lavoriamo', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      { source: '/:file(.*\\.bin)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/video/:path*', headers: [{ key: 'Cache-Control', value: WEEK }] },
      { source: '/projects/:path*', headers: [{ key: 'Cache-Control', value: WEEK }] },
      { source: '/gm-logo.:ext(webp|png)', headers: [{ key: 'Cache-Control', value: WEEK }] },
    ];
  },
};

export default nextConfig;
