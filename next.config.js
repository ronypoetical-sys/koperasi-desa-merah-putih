/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['afopmdnhyohktldkdpyj.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://afopmdnhyohktldkdpyj.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb3BtZG5oeW9oa3RsZGtkcHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM1NzksImV4cCI6MjA4ODY0OTU3OX0.e3cPj4ioo9XmhkvbWEeJH0fLbFoxqau0IHgnEaWYI5U',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Koperasi Desa Merah Putih',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://koperasi-desa-merah-putih-ronypoetical-sys-projects.vercel.app',
  },
}

module.exports = nextConfig
