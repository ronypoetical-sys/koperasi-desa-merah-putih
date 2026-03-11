'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setInfo('Email belum diverifikasi. Silakan cek kotak masuk email Anda.')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Email atau password salah.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Gunakan hard navigation agar cookie Supabase benar-benar ter-set
    // sebelum middleware membaca session
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-merah rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-display text-gray-900">Selamat Datang</h1>
          <p className="text-gray-500 mt-1">Masuk ke sistem akuntansi koperasi</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            {info && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                📧 {info}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="budi@koperasi.id"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah transition-colors" />
            </div>

            <div className="flex justify-end">
              <Link href="/auth/reset-password" className="text-sm text-merah hover:underline">Lupa password?</Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-merah hover:bg-merah-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Memverifikasi...
                </span>
              ) : 'Masuk →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-merah font-medium hover:underline">Daftar sekarang</Link>
          </p>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-gray-400">
        Dikembangkan oleh <span className="font-medium text-gray-500">Imam Sahroni Darmawan</span>
      </footer>
    </div>
  )
}
