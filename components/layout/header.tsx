'use client'

import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  user: { name?: string; email?: string; role: string }
  koperasi: { nama_koperasi: string }
}

export default function Header({ user, koperasi }: HeaderProps) {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'Pengguna'

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-medium text-gray-900">{koperasi?.nama_koperasi || 'Koperasi'}</h2>
        <p className="text-xs text-gray-400">Sistem Akuntansi Koperasi</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role || 'admin'}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-merah flex items-center justify-center text-white text-xs font-bold">
          {displayName[0]?.toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-merah transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Keluar
        </button>
      </div>
    </header>
  )
}
