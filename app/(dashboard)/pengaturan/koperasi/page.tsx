'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PengaturanKoperasiPage() {
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [koperasiId, setKoperasiId] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user) return
    const { data: userData } = await supabase.from('users').select('koperasi_id, koperasi(*)').eq('id', authUser.user.id).single() as any
    if (!userData?.koperasi_id) return
    setKoperasiId(userData.koperasi_id)
    setForm(userData.koperasi || {})
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('koperasi').update({
      nama_koperasi: form.nama_koperasi,
      alamat: form.alamat,
      desa: form.desa,
      kecamatan: form.kecamatan,
      kabupaten: form.kabupaten,
      provinsi: form.provinsi,
      no_akta: form.no_akta,
      npwp: form.npwp,
    }).eq('id', koperasiId)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display text-gray-900">Data Koperasi</h1>
        <p className="text-gray-500 text-sm">Kelola informasi koperasi</p>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">✅ Data berhasil disimpan</div>}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Koperasi</label>
          <input type="text" value={form.nama_koperasi || ''} onChange={e => setForm({ ...form, nama_koperasi: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {['desa', 'kecamatan', 'kabupaten', 'provinsi', 'no_akta', 'npwp'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
              <input type="text" value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea value={form.alamat || ''} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={2}
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
