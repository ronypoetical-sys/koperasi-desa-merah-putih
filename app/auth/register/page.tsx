'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Password tidak cocok'); return }
    if (form.password.length < 8) { setError('Password minimal 8 karakter'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, name: form.name },
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        setError('Email sudah terdaftar. Silakan login.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Jika langsung dapat session (email confirmation dimatikan) → redirect ke setup
    if (data?.session) {
      router.push('/setup')
      router.refresh()
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-display text-gray-900 mb-3">Pendaftaran Berhasil! 🎉</h2>
          <p className="text-gray-600 mb-2">Email verifikasi telah dikirim ke:</p>
          <p className="font-semibold text-gray-900 mb-6 bg-gray-100 py-2 px-4 rounded-lg inline-block">{form.email}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-blue-800 text-sm font-medium mb-2">📧 Langkah selanjutnya:</p>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
              <li>Buka email Anda di kotak masuk</li>
              <li>Klik link verifikasi yang dikirim</li>
              <li>Setelah terverifikasi, login dan setup koperasi</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500 mb-6">Tidak menerima email? Cek folder spam/junk.</p>
          <Link href="/auth/login" className="inline-block bg-merah hover:bg-merah-dark text-white font-semibold py-2.5 px-8 rounded-lg transition-colors">
            Ke Halaman Login →
          </Link>
        </div>
        <footer className="mt-10 text-center text-xs text-gray-400">
          Dikembangkan oleh <span className="font-medium text-gray-500">Imam Sahroni Darmawan</span>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-merah rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-display text-gray-900">Buat Akun Baru</h1>
          <p className="text-gray-500 mt-1">Daftarkan koperasi Anda hari ini</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            {[
              { label: 'Nama Lengkap', key: 'name', type: 'text', placeholder: 'Budi Santoso' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'budi@koperasi.id' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 8 karakter' },
              { label: 'Konfirmasi Password', key: 'confirmPassword', type: 'password', placeholder: '••••••••' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah transition-colors"
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-merah hover:bg-merah-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 mt-2">
              {loading ? 'Mendaftar...' : 'Daftar & Setup Koperasi →'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="text-merah font-medium hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
      <footer className="mt-8 text-center text-xs text-gray-400">
        Dikembangkan oleh <span className="font-medium text-gray-500">Imam Sahroni Darmawan</span>
      </footer>
    </div>
  )
}
