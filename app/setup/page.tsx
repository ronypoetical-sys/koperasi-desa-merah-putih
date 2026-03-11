'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FormData {
  nama_koperasi: string
  alamat: string
  desa: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  tanggal_berdiri: string
  no_akta: string
  npwp: string
  tahun_buku_mulai: number
  tahun_buku_akhir: number
}

function validateForm(form: FormData): string | null {
  if (!form.nama_koperasi.trim() || form.nama_koperasi.trim().length < 3) {
    return 'Nama koperasi minimal 3 karakter'
  }
  if (form.nama_koperasi.trim().length > 200) {
    return 'Nama koperasi maksimal 200 karakter'
  }
  if (form.tahun_buku_mulai < 2000 || form.tahun_buku_mulai > 2100) {
    return 'Tahun buku mulai tidak valid'
  }
  if (form.tahun_buku_akhir < form.tahun_buku_mulai) {
    return 'Tahun buku akhir harus >= tahun buku mulai'
  }
  if (form.npwp && !/^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/.test(form.npwp)) {
    return 'Format NPWP tidak valid (contoh: 01.234.567.8-901.234)'
  }
  return null
}

export default function SetupPage() {
  const currentYear = new Date().getFullYear()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState<FormData>({
    nama_koperasi: '',
    alamat: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '',
    tanggal_berdiri: '',
    no_akta: '', npwp: '',
    tahun_buku_mulai: currentYear,
    tahun_buku_akhir: currentYear,
  })

  function handleChange(key: string, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side validation (mirrors server constraints)
    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    // Insert koperasi
    const { data: koperasi, error: koperasiError } = await supabase
      .from('koperasi')
      .insert({
        nama_koperasi: form.nama_koperasi.trim(),
        alamat: form.alamat.trim() || null,
        desa: form.desa.trim() || null,
        kecamatan: form.kecamatan.trim() || null,
        kabupaten: form.kabupaten.trim() || null,
        provinsi: form.provinsi.trim() || null,
        tanggal_berdiri: form.tanggal_berdiri || null,
        no_akta: form.no_akta.trim() || null,
        npwp: form.npwp.trim() || null,
        tahun_buku_mulai: form.tahun_buku_mulai,
        tahun_buku_akhir: form.tahun_buku_akhir,
      })
      .select()
      .single()

    if (koperasiError) {
      setError('Gagal menyimpan data koperasi. Coba lagi.')
      setLoading(false)
      return
    }

    // Update user with koperasi_id
    const { error: userError } = await supabase
      .from('users')
      .update({ koperasi_id: koperasi.id })
      .eq('id', user.id)

    if (userError) {
      setError('Gagal mengaitkan akun dengan koperasi. Hubungi administrator.')
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-merah rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl">🏢</span>
          </div>
          <h1 className="text-3xl font-display text-gray-900">Setup Data Koperasi</h1>
          <p className="text-gray-500 mt-1">Lengkapi data koperasi Anda untuk memulai</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Koperasi <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.nama_koperasi} onChange={e => handleChange('nama_koperasi', e.target.value)}
                required minLength={3} maxLength={200}
                placeholder="Koperasi Desa Merah Putih"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Desa', key: 'desa', placeholder: 'Nama Desa' },
                { label: 'Kecamatan', key: 'kecamatan', placeholder: 'Nama Kecamatan' },
                { label: 'Kabupaten', key: 'kabupaten', placeholder: 'Nama Kabupaten' },
                { label: 'Provinsi', key: 'provinsi', placeholder: 'Nama Provinsi' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="text" value={form[f.key as keyof FormData] as string}
                    onChange={e => handleChange(f.key, e.target.value)} placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Lengkap</label>
              <textarea value={form.alamat} onChange={e => handleChange('alamat', e.target.value)}
                rows={2} placeholder="Jl. Raya Desa No. 1..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Akta Pendirian</label>
                <input type="text" value={form.no_akta} onChange={e => handleChange('no_akta', e.target.value)}
                  placeholder="No. Akta..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">NPWP</label>
                <input type="text" value={form.npwp} onChange={e => handleChange('npwp', e.target.value)}
                  placeholder="01.234.567.8-901.234"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
                <p className="text-xs text-gray-400 mt-1">Format: XX.XXX.XXX.X-XXX.XXX</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Berdiri</label>
                <input type="date" value={form.tanggal_berdiri} onChange={e => handleChange('tanggal_berdiri', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Buku Mulai</label>
                <input type="number" value={form.tahun_buku_mulai}
                  onChange={e => handleChange('tahun_buku_mulai', parseInt(e.target.value))}
                  min="2000" max="2100"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Buku Akhir</label>
                <input type="number" value={form.tahun_buku_akhir}
                  onChange={e => handleChange('tahun_buku_akhir', parseInt(e.target.value))}
                  min={form.tahun_buku_mulai} max="2100"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-merah hover:bg-merah-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2">
              {loading ? 'Menyimpan...' : 'Simpan & Mulai Gunakan Aplikasi →'}
            </button>
          </form>
        </div>
        <footer className="mt-8 pb-6 text-center text-xs text-gray-400">
          Dikembangkan oleh <span className="font-medium text-gray-500">Imam Sahroni Darmawan</span>
        </footer>
      </div>
    </div>
  )
}
