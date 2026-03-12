'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 20

interface Anggota {
  id: string
  nama: string
  nik: string
  alamat: string
  no_hp: string
  tanggal_masuk: string
  status: 'aktif' | 'nonaktif'
}

export default function AnggotaPage() {
  const { koperasiId, loading: authLoading } = useAuth()
  const [anggota, setAnggota]   = useState<Anggota[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState<Anggota | null>(null)
  const [form, setForm]         = useState({ nama: '', nik: '', alamat: '', no_hp: '', tanggal_masuk: '', status: 'aktif' })
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)

  useEffect(() => {
    if (!authLoading && koperasiId) loadAnggota()
  }, [authLoading, koperasiId])

  // Reset page ke 1 kalau search berubah
  useEffect(() => { setPage(1) }, [search])

  async function loadAnggota() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('anggota').select('*').eq('koperasi_id', koperasiId).order('nama')
    setAnggota(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.nama.trim()) return
    setSaving(true)
    const supabase = createClient()
    try {
      if (editData) {
        await supabase.from('anggota').update({
          nama: form.nama.trim(),
          nik: form.nik.trim(),
          alamat: form.alamat.trim(),
          no_hp: form.no_hp.trim(),
          tanggal_masuk: form.tanggal_masuk || null,
          status: form.status,
        }).eq('id', editData.id)
      } else {
        await supabase.from('anggota').insert({
          koperasi_id: koperasiId,
          nama: form.nama.trim(),
          nik: form.nik.trim(),
          alamat: form.alamat.trim(),
          no_hp: form.no_hp.trim(),
          tanggal_masuk: form.tanggal_masuk || null,
          status: form.status,
        })
      }
      setShowForm(false)
      setEditData(null)
      setForm({ nama: '', nik: '', alamat: '', no_hp: '', tanggal_masuk: '', status: 'aktif' })
      loadAnggota()
    } catch {
      // silently handled
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus anggota ini? Pastikan tidak ada transaksi terkait.')) return
    const supabase = createClient()
    const { error } = await supabase.from('anggota').delete().eq('id', id)
    if (error) alert('Tidak bisa hapus anggota yang memiliki transaksi!')
    else loadAnggota()
  }

  function openEdit(a: Anggota) {
    setEditData(a)
    setForm({ nama: a.nama, nik: a.nik || '', alamat: a.alamat || '', no_hp: a.no_hp || '', tanggal_masuk: a.tanggal_masuk || '', status: a.status })
    setShowForm(true)
  }

  // PERF-003: Pagination logic
  const filtered = useMemo(() =>
    anggota.filter(a =>
      a.nama.toLowerCase().includes(search.toLowerCase()) || (a.nik || '').includes(search)
    ), [anggota, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (authLoading || loading) return <div className="flex items-center justify-center py-16 text-gray-400">Memuat data...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Data Anggota</h1>
          <p className="text-gray-500 text-sm">{anggota.length} anggota terdaftar</p>
        </div>
        <button onClick={() => { setEditData(null); setForm({ nama: '', nik: '', alamat: '', no_hp: '', tanggal_masuk: new Date().toLocaleDateString('sv-SE'), status: 'aktif' }); setShowForm(true) }}
          className="bg-merah hover:bg-merah-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Tambah Anggota
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <input type="text" placeholder="Cari nama atau NIK anggota..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Nama</th>
              <th className="px-6 py-3 text-left">NIK</th>
              <th className="px-6 py-3 text-left">No. HP</th>
              <th className="px-6 py-3 text-left">Tanggal Masuk</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Tidak ada data anggota</td></tr>
            ) : paginated.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{a.nama}</td>
                <td className="px-6 py-3 text-gray-500 font-mono">{a.nik || '-'}</td>
                <td className="px-6 py-3 text-gray-500">{a.no_hp || '-'}</td>
                <td className="px-6 py-3 text-gray-500">{a.tanggal_masuk ? new Date(a.tanggal_masuk).toLocaleDateString('id-ID') : '-'}</td>
                <td className="px-6 py-3">
                  <span className={a.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}>{a.status}</span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(a)} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-5">{editData ? 'Edit Anggota' : 'Tambah Anggota'}</h2>
            <div className="space-y-4">
              {[
                { label: 'Nama Lengkap *', key: 'nama', type: 'text' },
                { label: 'NIK', key: 'nik', type: 'text' },
                { label: 'No. HP', key: 'no_hp', type: 'tel' },
                { label: 'Alamat', key: 'alamat', type: 'text' },
                { label: 'Tanggal Masuk', key: 'tanggal_masuk', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah">
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-aktif</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={!form.nama.trim() || saving}
                className="flex-1 bg-merah text-white rounded-lg text-sm font-medium py-2 disabled:opacity-60 hover:bg-merah-dark">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface Anggota {
  id: string
  nama: string
  nik: string
  alamat: string
  no_hp: string
  tanggal_masuk: string
  status: 'aktif' | 'nonaktif'
}

export default function AnggotaPage() {
  const { koperasiId, loading: authLoading } = useAuth()
  const [anggota, setAnggota]   = useState<Anggota[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState<Anggota | null>(null)
  const [form, setForm]         = useState({ nama: '', nik: '', alamat: '', no_hp: '', tanggal_masuk: '', status: 'aktif' })
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    if (!authLoading && koperasiId) loadAnggota()
  }, [authLoading, koperasiId])

  async function loadAnggota() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('anggota').select('*').eq('koperasi_id', koperasiId).order('nama')
    setAnggota(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.nama.trim()) return
    setSaving(true)
    const supabase = createClient()
    try {
      if (editData) {
        await supabase.from('anggota').update({
          nama: form.nama.trim(),
          nik: form.nik.trim(),
          alamat: form.alamat.trim(),
          no_hp: form.no_hp.trim(),
          tanggal_masuk: form.tanggal_masuk || null,
          status: form.status,
        }).eq('id', editData.id)
      } else {
        await supabase.from('anggota').insert({
          koperasi_id: koperasiId,
          nama: form.nama.trim(),
          nik: form.nik.trim(),
          alamat: form.alamat.trim(),
          no_hp: form.no_hp.trim(),
          tanggal_masuk: form.tanggal_masuk || null,
          status: form.status,
        })
      }
      setShowForm(false)
      setEditData(null)
      setForm({ nama: '', nik: '', alamat: '', no_hp: '', tanggal_masuk: '', status: 'aktif' })
      loadAnggota()
    } catch {
      // silently handled — errors visible if loadAnggota fails
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus anggota ini? Pastikan tidak ada transaksi terkait.')) return
    const supabase = createClient()
    const { error } = await supabase.from('anggota').delete().eq('id', id)
    if (error) alert('Tidak bisa hapus anggota yang memiliki transaksi!')
    else loadAnggota()
  }

  function openEdit(a: Anggota) {
    setEditData(a)
    setForm({ nama: a.nama, nik: a.nik || '', alamat: a.alamat || '', no_hp: a.no_hp || '', tanggal_masuk: a.tanggal_masuk || '', status: a.status })
    setShowForm(true)
  }

  const filtered = anggota.filter(a =>
    a.nama.toLowerCase().includes(search.toLowerCase()) || (a.nik || '').includes(search)
  )

  if (authLoading || loading) return <div className="flex items-center justify-center py-16 text-gray-400">Memuat data...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Data Anggota</h1>
          <p className="text-gray-500 text-sm">{anggota.length} anggota terdaftar</p>
        </div>
        <button onClick={() => { setEditData(null); setForm({ nama: '', nik: '', alamat: '', no_hp: '', tanggal_masuk: new Date().toLocaleDateString('sv-SE'), status: 'aktif' }); setShowForm(true) }}
          className="bg-merah hover:bg-merah-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Tambah Anggota
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <input type="text" placeholder="Cari nama atau NIK anggota..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Nama</th>
              <th className="px-6 py-3 text-left">NIK</th>
              <th className="px-6 py-3 text-left">No. HP</th>
              <th className="px-6 py-3 text-left">Tanggal Masuk</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Tidak ada data anggota</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{a.nama}</td>
                <td className="px-6 py-3 text-gray-500 font-mono">{a.nik || '-'}</td>
                <td className="px-6 py-3 text-gray-500">{a.no_hp || '-'}</td>
                <td className="px-6 py-3 text-gray-500">{a.tanggal_masuk ? new Date(a.tanggal_masuk).toLocaleDateString('id-ID') : '-'}</td>
                <td className="px-6 py-3">
                  <span className={a.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}>{a.status}</span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(a)} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-5">{editData ? 'Edit Anggota' : 'Tambah Anggota'}</h2>
            <div className="space-y-4">
              {[
                { label: 'Nama Lengkap *', key: 'nama', type: 'text' },
                { label: 'NIK', key: 'nik', type: 'text' },
                { label: 'No. HP', key: 'no_hp', type: 'tel' },
                { label: 'Alamat', key: 'alamat', type: 'text' },
                { label: 'Tanggal Masuk', key: 'tanggal_masuk', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah">
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-aktif</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={!form.nama.trim() || saving}
                className="flex-1 bg-merah text-white rounded-lg text-sm font-medium py-2 disabled:opacity-60 hover:bg-merah-dark">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
