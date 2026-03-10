'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TEMPLATE_ICONS: Record<string, string> = {
  simpan_pinjam: '🏦',
  toko: '🛒',
  pertanian: '🌾',
}

export default function UnitUsahaPage() {
  const [units, setUnits] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [koperasiId, setKoperasiId] = useState('')
  const [form, setForm] = useState({ kode_unit: '', nama_unit: '', deskripsi: '', status: 'aktif', template_id: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user) return

    const { data: userData } = await supabase.from('users').select('koperasi_id').eq('id', authUser.user.id).single() as any
    if (!userData?.koperasi_id) return
    setKoperasiId(userData.koperasi_id)

    const [unitData, templateData] = await Promise.all([
      supabase.from('unit_usaha').select('*').eq('koperasi_id', userData.koperasi_id).order('nama_unit'),
      supabase.from('coa_templates').select('*'),
    ])

    setUnits(unitData.data || [])
    setTemplates(templateData.data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.kode_unit || !form.nama_unit) return
    setSaving(true)

    const supabase = createClient()

    const { data: unit, error } = await supabase.from('unit_usaha').insert({
      koperasi_id: koperasiId,
      kode_unit: form.kode_unit,
      nama_unit: form.nama_unit,
      deskripsi: form.deskripsi,
      status: form.status,
    }).select().single() as any

    if (!error && form.template_id && unit) {
      // Load template COA items dan buat accounts
      const { data: templateItems } = await supabase
        .from('coa_template_items')
        .select('*')
        .eq('template_id', form.template_id)
        .order('urutan')

      if (templateItems && templateItems.length > 0) {
        const accounts = templateItems.map(item => ({
          koperasi_id: koperasiId,
          unit_usaha_id: unit.id,
          kode_akun: `${form.kode_unit}-${item.kode_akun}`,
          nama_akun: item.nama_akun,
          kategori: item.kategori,
          is_system: true,
        }))
        await supabase.from('accounts').insert(accounts)
      }
    }

    setSaving(false)
    setShowForm(false)
    setForm({ kode_unit: '', nama_unit: '', deskripsi: '', status: 'aktif', template_id: '' })
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Unit Usaha</h1>
          <p className="text-gray-500 text-sm">{units.length} unit usaha aktif</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-merah hover:bg-merah-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Tambah Unit Usaha
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.length === 0 ? (
            <div className="col-span-3 bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-4xl mb-3">🏪</p>
              <p className="text-gray-500">Belum ada unit usaha. Tambah unit usaha pertama!</p>
            </div>
          ) : units.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl">
                  🏪
                </div>
                <span className={u.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}>{u.status}</span>
              </div>
              <p className="font-semibold text-gray-900">{u.nama_unit}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{u.kode_unit}</p>
              {u.deskripsi && <p className="text-xs text-gray-500 mt-2">{u.deskripsi}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-5">Tambah Unit Usaha</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Unit *</label>
                  <input type="text" value={form.kode_unit} onChange={e => setForm({ ...form, kode_unit: e.target.value.toUpperCase() })}
                    placeholder="SP, TOKO, dll" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Unit *</label>
                  <input type="text" value={form.nama_unit} onChange={e => setForm({ ...form, nama_unit: e.target.value })}
                    placeholder="Simpan Pinjam" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template COA (Opsional)</label>
                <select value={form.template_id} onChange={e => setForm({ ...form, template_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah">
                  <option value="">Tanpa template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.nama_template}</option>)}
                </select>
                {form.template_id && <p className="text-xs text-green-600 mt-1">✓ Akun standar akan dibuat otomatis</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={!form.kode_unit || !form.nama_unit || saving}
                className="flex-1 bg-merah text-white rounded-lg text-sm font-medium py-2 disabled:opacity-60 hover:bg-merah-dark">
                {saving ? 'Menyimpan...' : 'Buat Unit Usaha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
