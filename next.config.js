/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ARCH-005 RESOLVED: database.types.ts regenerated from Supabase schema.
  // TypeScript strict checking is now fully enabled — no suppressions.
  // ESLint still runs (no ignoreDuringBuilds)
  images: {
    domains: ['afopmdnhyohktldkdpyj.supabase.co'],
  },
  // SECURITY FIX: hardcoded credentials removed — use Vercel env vars only
  // Set these in Vercel Dashboard → Settings → Environment Variables:
  // NEXT_PUBLIC_SUPABASE_URL
  // NEXT_PUBLIC_SUPABASE_ANON_KEY
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
