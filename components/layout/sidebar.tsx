'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type Role = 'admin' | 'bendahara' | 'kasir' | 'pengawas'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: '📊',
    roles: ['admin', 'bendahara', 'kasir', 'pengawas'],
  },
  {
    label: 'Master Data',
    icon: '🗂️',
    roles: ['admin', 'bendahara'],
    children: [
      { label: 'Anggota', href: '/anggota', icon: '👥' },
      { label: 'Unit Usaha', href: '/unit-usaha', icon: '🏪' },
      { label: 'Chart of Accounts', href: '/accounts', icon: '📋' },
    ],
  },
  {
    label: 'Transaksi',
    icon: '💰',
    roles: ['admin', 'bendahara', 'kasir'],
    children: [
      { label: 'Simpanan', href: '/transaksi/simpanan', icon: '🏦' },
      { label: 'Pinjaman', href: '/transaksi/pinjaman', icon: '📤' },
      { label: 'Angsuran', href: '/transaksi/angsuran', icon: '📥' },
      { label: 'Penjualan', href: '/transaksi/penjualan', icon: '🛒' },
      { label: 'Pembelian', href: '/transaksi/pembelian', icon: '🛍️' },
    ],
  },
  {
    label: 'Akuntansi',
    icon: '📒',
    roles: ['admin', 'bendahara'],
    children: [
      { label: 'Jurnal Umum', href: '/akuntansi/jurnal', icon: '📝' },
      { label: 'Buku Besar', href: '/akuntansi/buku-besar', icon: '📚' },
    ],
  },
  {
    label: 'Laporan',
    icon: '📈',
    roles: ['admin', 'bendahara', 'pengawas'],
    children: [
      { label: 'Neraca', href: '/laporan/neraca', icon: '⚖️' },
      { label: 'Laporan SHU', href: '/laporan/shu', icon: '💹' },
      { label: 'Arus Kas', href: '/laporan/arus-kas', icon: '💸' },
      { label: 'Laporan Unit Usaha', href: '/laporan/unit-usaha', icon: '🏢' },
    ],
  },
  {
    label: 'Pengaturan',
    icon: '⚙️',
    roles: ['admin'],
    children: [
      { label: 'Data Koperasi', href: '/pengaturan/koperasi', icon: '🏛️' },
      { label: 'Manajemen User', href: '/pengaturan/users', icon: '👤' },
      { label: 'Template COA', href: '/pengaturan/template-coa', icon: '📄' },
    ],
  },
]

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>(['Transaksi', 'Laporan'])
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleMenu(label: string) {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    )
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href))
  }

  const visibleMenus = menuItems.filter(item => item.roles.includes(role))

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-merah rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">KD</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">Koperasi Desa</p>
            <p className="text-xs text-merah font-medium">Merah Putih</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleMenus.map(item => (
          <div key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-merah text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className={`text-xs transition-transform ${openMenus.includes(item.label) ? 'rotate-90' : ''}`}>▶</span>
                </button>

                {openMenus.includes(item.label) && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                    {item.children?.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isActive(child.href)
                            ? 'bg-red-50 text-merah font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        <span className="text-sm">{child.icon}</span>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Role badge */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-xs text-gray-500 capitalize">Login sebagai {role}</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Dikembangkan oleh<br />
          <span className="font-medium text-gray-500">Imam Sahroni Darmawan</span>
        </p>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col shadow-sm no-print">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm no-print"
        aria-label="Buka menu"
      >
        <span className="text-lg">☰</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-white flex flex-col shadow-xl h-full overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              ✕
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
