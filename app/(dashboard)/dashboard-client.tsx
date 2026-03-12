'use client'

import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DashboardClientProps {
  stats: any
  recentTransactions: any[]
  shuRawData: any[]
  tahun: number
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatRupiah(n: number) {
  if (!n) return 'Rp 0'
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function DashboardClient({ stats, recentTransactions, shuRawData, tahun }: DashboardClientProps) {
  // PERF-005 FIX: useMemo — kalkulasi chart data hanya dijalankan ulang jika shuRawData/tahun berubah
  const chartData = useMemo(() => {
    const bulanMap: Record<number, { pendapatan: number; beban: number }> = {}
    shuRawData.forEach(row => {
      if (!bulanMap[row.bulan]) bulanMap[row.bulan] = { pendapatan: 0, beban: 0 }
      bulanMap[row.bulan].pendapatan += row.pendapatan || 0
      bulanMap[row.bulan].beban += row.beban || 0
    })
    return BULAN.map((nama, i) => ({
      bulan: nama,
      pendapatan: bulanMap[i + 1]?.pendapatan || 0,
      beban: bulanMap[i + 1]?.beban || 0,
      shu: (bulanMap[i + 1]?.pendapatan || 0) - (bulanMap[i + 1]?.beban || 0),
    }))
  }, [shuRawData])

  const statCards = useMemo(() => [
    { label: 'Total Anggota', value: stats?.total_anggota || 0, format: 'number', icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Simpanan', value: stats?.total_simpanan || 0, format: 'currency', icon: '🏦', color: 'bg-green-50 text-green-600' },
    { label: 'Total Pinjaman', value: stats?.total_pinjaman || 0, format: 'currency', icon: '📤', color: 'bg-orange-50 text-orange-600' },
    { label: 'Unit Usaha Aktif', value: stats?.total_unit_usaha || 0, format: 'number', icon: '🏪', color: 'bg-purple-50 text-purple-600' },
  ], [stats])

  const jenisBadge: Record<string, string> = {
    simpanan: 'bg-green-100 text-green-700',
    pinjaman: 'bg-orange-100 text-orange-700',
    angsuran: 'bg-blue-100 text-blue-700',
    penjualan: 'bg-teal-100 text-teal-700',
    pembelian: 'bg-red-100 text-red-700',
    biaya_operasional: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-display text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Ringkasan keuangan koperasi tahun {tahun}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{card.label}</p>
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${card.color}`}>
                {card.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {card.format === 'currency' ? formatRupiah(card.value) : card.value.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SHU Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Tren SHU Bulanan {tahun}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorShu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CC0001" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#CC0001" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${(v/1_000_000).toFixed(0)}Jt`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatRupiah(v)} />
              <Area type="monotone" dataKey="shu" name="SHU" stroke="#CC0001" fill="url(#colorShu)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pendapatan vs Beban */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Pendapatan vs Beban {tahun}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${(v/1_000_000).toFixed(0)}Jt`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatRupiah(v)} />
              <Legend />
              <Bar dataKey="pendapatan" name="Pendapatan" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="beban" name="Beban" fill="#CC0001" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Tanggal</th>
                <th className="px-6 py-3 text-left">Jenis</th>
                <th className="px-6 py-3 text-left">Anggota / Keterangan</th>
                <th className="px-6 py-3 text-left">Unit Usaha</th>
                <th className="px-6 py-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Belum ada transaksi. Mulai dengan menambah transaksi pertama!
                  </td>
                </tr>
              ) : (
                recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${jenisBadge[tx.jenis_transaksi] || 'bg-gray-100 text-gray-700'}`}>
                        {tx.jenis_transaksi.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {tx.anggota?.nama || tx.keterangan || '-'}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{tx.unit_usaha?.nama_unit}</td>
                    <td className="px-6 py-3 text-right font-mono font-medium text-gray-900">
                      {formatRupiah(tx.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
