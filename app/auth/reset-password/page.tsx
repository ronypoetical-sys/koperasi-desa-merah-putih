'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-merah rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl">🔑</span>
          </div>
          <h1 className="text-3xl font-display text-gray-900">Reset Password</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-4xl mb-4">📧</p>
              <p className="font-semibold text-gray-900 mb-2">Email terkirim!</p>
              <p className="text-gray-500 text-sm">Cek email {email} dan ikuti instruksi untuk reset password.</p>
              <Link href="/auth/login" className="inline-block mt-6 text-merah hover:underline text-sm">← Kembali ke Login</Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@koperasi.id"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-merah hover:bg-merah-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-60">
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link href="/auth/login" className="text-merah hover:underline">← Kembali ke Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
