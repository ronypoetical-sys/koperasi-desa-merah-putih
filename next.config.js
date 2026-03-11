/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SECURITY FIX: removed ignoreBuildErrors — TypeScript errors will now fail the build
  // SECURITY FIX: removed ignoreDuringBuilds — ESLint violations will now fail the build
  images: {
    domains: ['afopmdnhyohktldkdpyj.supabase.co'],
  },
  // SECURITY FIX: removed hardcoded credentials — use Vercel env vars only
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
