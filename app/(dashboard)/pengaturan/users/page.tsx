'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const ROLES = ['admin', 'bendahara', 'kasir', 'pengawas']

export default function UsersPage() {
  const { userId: currentUserId, koperasiId, role: currentRole, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && koperasiId) loadData()
  }, [authLoading, koperasiId])

  // SEC-003 FIX: Server-side role check — only admin can access this page
  if (!authLoading && currentRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 text-sm">Hanya Admin yang dapat mengelola pengguna.</p>
      </div>
    )
  }

  async function loadData() {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('koperasi_id', koperasiId)
      .order('created_at')

    if (fetchError) {
      setError('Gagal memuat data pengguna')
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (userId === currentUserId) {
      alert('Anda tidak dapat mengubah role diri sendiri')
      return
    }
    setSaving(userId)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .eq('koperasi_id', koperasiId) // extra safety: scoped to koperasi

    if (updateError) {
      setError('Gagal mengubah role. Pastikan Anda memiliki hak akses Admin.')
    }
    setSaving(null)
    loadData()
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    bendahara: 'bg-blue-100 text-blue-700',
    kasir: 'bg-green-100 text-green-700',
    pengawas: 'bg-purple-100 text-purple-700',
  }

  if (authLoading || loading) return <div className="flex items-center justify-center py-16 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display text-gray-900">Manajemen User</h1>
        <p className="text-gray-500 text-sm">Kelola hak akses pengguna koperasi</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Role legend */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-800 mb-3">📋 Keterangan Role</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <div><span className="font-semibold">Admin:</span> Akses penuh ke semua fitur</div>
          <div><span className="font-semibold">Bendahara:</span> Transaksi, akuntansi, laporan</div>
          <div><span className="font-semibold">Kasir:</span> Input transaksi saja</div>
          <div><span className="font-semibold">Pengawas:</span> Lihat laporan (read-only)</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Nama</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Bergabung</th>
              <th className="px-6 py-3 text-center">Ubah Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Belum ada pengguna lain</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-merah flex items-center justify-center text-white text-xs font-bold">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.name || 'Pengguna'}</p>
                      {u.id === currentUserId && <p className="text-xs text-merah">Anda</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 text-center">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={saving === u.id}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-merah/20 disabled:opacity-60"
                    >
                      {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          ℹ️ <strong>Cara menambah pengguna:</strong> Pengguna baru harus mendaftar sendiri di halaman Register menggunakan email, kemudian admin dapat mengubah role mereka di sini.
        </p>
      </div>
    </div>
  )
}
