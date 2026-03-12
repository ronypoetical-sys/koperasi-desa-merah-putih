'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logError, mapDbErrorToUserMessage } from '@/lib/utils/logger'

export default function PengaturanKoperasiPage() {
  const { koperasiId, role: currentRole, loading: authLoading } = useAuth()
  const [form, setForm]       = useState<any>({})
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('')  // REL-006: untuk optimistic locking
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { if (!authLoading && koperasiId) loadData() }, [authLoading, koperasiId])

  // SEC-003 FIX: Only admin/bendahara can edit koperasi settings
  if (!authLoading && !['admin', 'bendahara'].includes(currentRole)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 text-sm">Hanya Admin atau Bendahara yang dapat mengubah pengaturan koperasi.</p>
      </div>
    )
  }

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('koperasi').select('*').eq('id', koperasiId).single()
    setForm(data || {})
    setLastUpdatedAt(data?.updated_at || new Date().toISOString())  // REL-006
    setLoading(false)
  }

  async function handleSave() {
    if (!form.nama_koperasi?.trim()) { setError('Nama koperasi wajib diisi'); return }
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      // REL-006 FIX: Gunakan stored procedure dengan optimistic locking
      // Akan gagal dengan error 'conflict' jika data berubah sejak terakhir dimuat
      const { data: result, error: rpcErr } = await supabase.rpc('update_koperasi_safe', {
        p_id: koperasiId,
        p_last_known_updated_at: lastUpdatedAt,
        p_data: {
          nama_koperasi:    form.nama_koperasi?.trim(),
          alamat:           form.alamat?.trim()    || '',
          desa:             form.desa?.trim()      || '',
          kecamatan:        form.kecamatan?.trim() || '',
          kabupaten:        form.kabupaten?.trim() || '',
          provinsi:         form.provinsi?.trim()  || '',
          no_akta:          form.no_akta?.trim()   || '',
          npwp:             form.npwp?.trim()      || '',
          tanggal_berdiri:  form.tanggal_berdiri   || '',
          tahun_buku_mulai: form.tahun_buku_mulai  || new Date().getFullYear(),
          tahun_buku_akhir: form.tahun_buku_akhir  || new Date().getFullYear(),
        },
      })

      if (rpcErr) throw rpcErr

      const res = result as any
      if (!res?.success) {
        if (res?.error === 'conflict') {
          setError(res.message || 'Data telah diubah oleh pengguna lain. Muat ulang halaman.')
        } else {
          setError(res?.message || 'Gagal menyimpan data koperasi')
        }
        return
      }

      // Reload untuk mendapatkan updated_at terbaru
      await loadData()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      logError('PengaturanKoperasiPage.handleSave', 'Failed to save koperasi', err)
      setError(mapDbErrorToUserMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <div className="py-16 text-center text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display text-gray-900">Data Koperasi</h1>
        <p className="text-gray-500 text-sm">Kelola informasi koperasi</p>
      </div>
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">✅ Data berhasil disimpan</div>}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Koperasi *</label>
          <input type="text" value={form.nama_koperasi || ''}
            onChange={e => setForm({...form, nama_koperasi: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {['desa', 'kecamatan', 'kabupaten', 'provinsi', 'no_akta', 'npwp'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
              <input type="text" value={form[field] || ''} onChange={e => setForm({...form, [field]: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea value={form.alamat || ''} onChange={e => setForm({...form, alamat: e.target.value})} rows={2}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah resize-none" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-merah hover:bg-merah-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}


export default function PengaturanKoperasiPage() {
  const { koperasiId, userId, role: currentRole, loading: authLoading } = useAuth()
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (!authLoading && koperasiId) loadData() }, [authLoading, koperasiId])

  // SEC-003 FIX: Only admin/bendahara can edit koperasi settings
  if (!authLoading && !['admin', 'bendahara'].includes(currentRole)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 text-sm">Hanya Admin atau Bendahara yang dapat mengubah pengaturan koperasi.</p>
      </div>
    )
  }

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('koperasi').select('*').eq('id', koperasiId).single()
    setForm(data || {})
    setLoading(false)
  }

  async function handleSave() {
    if (!form.nama_koperasi?.trim()) { setError('Nama koperasi wajib diisi'); return }
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      // Gunakan stored procedure update dengan audit log
      const { error: rpcErr } = await supabase.rpc('update_koperasi_with_audit', {
        p_koperasi_id: koperasiId,
        p_user_id: userId,
        p_data: {
          nama_koperasi: form.nama_koperasi?.trim(),
          alamat:    form.alamat?.trim()    || null,
          desa:      form.desa?.trim()      || null,
          kecamatan: form.kecamatan?.trim() || null,
          kabupaten: form.kabupaten?.trim() || null,
          provinsi:  form.provinsi?.trim()  || null,
          no_akta:   form.no_akta?.trim()   || null,
          npwp:      form.npwp?.trim()      || null,
        },
      })
      if (rpcErr) throw new Error('Gagal menyimpan data koperasi')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <div className="py-16 text-center text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display text-gray-900">Data Koperasi</h1>
        <p className="text-gray-500 text-sm">Kelola informasi koperasi</p>
      </div>
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">✅ Data berhasil disimpan</div>}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Koperasi *</label>
          <input type="text" value={form.nama_koperasi || ''}
            onChange={e => setForm({...form, nama_koperasi: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {['desa', 'kecamatan', 'kabupaten', 'provinsi', 'no_akta', 'npwp'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
              <input type="text" value={form[field] || ''} onChange={e => setForm({...form, [field]: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea value={form.alamat || ''} onChange={e => setForm({...form, alamat: e.target.value})} rows={2}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah resize-none" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-merah hover:bg-merah-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}
