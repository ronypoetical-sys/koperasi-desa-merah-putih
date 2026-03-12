'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 25

const KATEGORI_COLORS: Record<string, string> = {
  aset: 'bg-blue-100 text-blue-700',
  kewajiban: 'bg-orange-100 text-orange-700',
  modal: 'bg-purple-100 text-purple-700',
  pendapatan: 'bg-green-100 text-green-700',
  beban: 'bg-red-100 text-red-700',
}

export default function AccountsPage() {
  const { koperasiId, role, loading: authLoading } = useAuth()
  const [accounts, setAccounts] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('semua')
  const [page, setPage]     = useState(1)
  const [form, setForm] = useState({ kode_akun: '', nama_akun: '', kategori: 'aset', unit_usaha_id: '', parent_id: '' })

  const canEdit = ['admin', 'bendahara'].includes(role)

  useEffect(() => { if (!authLoading && koperasiId) loadData() }, [authLoading, koperasiId])

  async function loadData() {
    const supabase = createClient()
    const [acc, unit] = await Promise.all([
      supabase.from('accounts').select('*, unit_usaha(nama_unit)').eq('koperasi_id', koperasiId).order('kode_akun'),
      supabase.from('unit_usaha').select('id, nama_unit').eq('koperasi_id', koperasiId),
    ])

    setAccounts(acc.data || [])
    setUnits(unit.data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.kode_akun || !form.nama_akun) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('accounts').insert({
      koperasi_id: koperasiId,
      kode_akun: form.kode_akun,
      nama_akun: form.nama_akun,
      kategori: form.kategori as 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban',
      unit_usaha_id: form.unit_usaha_id || null,
      parent_id: form.parent_id || null,
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!error) {
      setShowForm(false)
      setForm({ kode_akun: '', nama_akun: '', kategori: 'aset', unit_usaha_id: '', parent_id: '' })
      loadData()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus akun ini? Pastikan akun belum digunakan dalam jurnal.')) return
    const supabase = createClient()
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) alert('Tidak bisa hapus akun yang sudah digunakan dalam jurnal!')
    else loadData()
  }

  const filtered   = useMemo(() => filter === 'semua' ? accounts : accounts.filter(a => a.kategori === filter), [accounts, filter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-500 text-sm">{accounts.length} akun terdaftar</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="bg-merah hover:bg-merah-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Tambah Akun
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['semua', 'aset', 'kewajiban', 'modal', 'pendapatan', 'beban'].map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === k ? 'bg-merah text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-merah hover:text-merah'}`}>
            {k}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Memuat...</div>
        ) : (
          <>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Kode</th>
                <th className="px-6 py-3 text-left">Nama Akun</th>
                <th className="px-6 py-3 text-left">Kategori</th>
                <th className="px-6 py-3 text-left">Unit Usaha</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Tidak ada akun</td></tr>
              ) : paginated.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-gray-600 text-xs">{a.kode_akun}</td>
                  <td className="px-6 py-3 text-gray-800 font-medium">{a.nama_akun}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${KATEGORI_COLORS[a.kategori]}`}>{a.kategori}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{a.unit_usaha?.nama_unit || '-'}</td>
                  <td className="px-6 py-3 text-center">
                    {!a.is_system && (
                      <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">Hapus</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-5">Tambah Akun</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Akun *</label>
                  <input type="text" value={form.kode_akun} onChange={e => setForm({ ...form, kode_akun: e.target.value })}
                    placeholder="1-1001" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                  <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah">
                    {['aset', 'kewajiban', 'modal', 'pendapatan', 'beban'].map(k => <option key={k} value={k} className="capitalize">{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun *</label>
                <input type="text" value={form.nama_akun} onChange={e => setForm({ ...form, nama_akun: e.target.value })}
                  placeholder="Kas Tunai" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Usaha (Opsional)</label>
                <select value={form.unit_usaha_id} onChange={e => setForm({ ...form, unit_usaha_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah">
                  <option value="">Semua unit / Umum</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={!form.kode_akun || !form.nama_akun || saving}
                className="flex-1 bg-merah text-white rounded-lg text-sm font-medium py-2 disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
