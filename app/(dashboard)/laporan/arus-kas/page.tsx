'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function formatRp(n: number) {
  return `Rp ${Math.abs(n).toLocaleString('id-ID')}`
}

export default function ArusKasPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [bulan, setBulan] = useState(0) // 0 = semua
  const [koperasiNama, setKoperasiNama] = useState('')
  const [koperasiAlamat, setKoperasiAlamat] = useState('')

  useEffect(() => { loadData() }, [tahun, bulan])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user) return
    const { data: userData } = await supabase
      .from('users')
      .select('koperasi_id, koperasi(nama_koperasi, alamat, desa, kecamatan, kabupaten, provinsi)')
      .eq('id', authUser.user.id)
      .single() as any
    if (!userData?.koperasi_id) return

    const kop = userData.koperasi as any
    setKoperasiNama(kop?.nama_koperasi || '')
    setKoperasiAlamat([kop?.alamat, kop?.desa, kop?.kecamatan, kop?.kabupaten].filter(Boolean).join(', '))

    let query = supabase
      .from('transactions')
      .select('*, unit_usaha(nama_unit)')
      .eq('koperasi_id', userData.koperasi_id)
      .gte('tanggal', `${tahun}-01-01`)
      .lte('tanggal', `${tahun}-12-31`)
      .order('tanggal', { ascending: true })

    if (bulan > 0) {
      const m = bulan.toString().padStart(2, '0')
      const lastDay = new Date(tahun, bulan, 0).getDate()
      query = query.gte('tanggal', `${tahun}-${m}-01`).lte('tanggal', `${tahun}-${m}-${lastDay}`)
    }

    const { data: txData } = await query
    setData(txData || [])
    setLoading(false)
  }

  // Kategorisasi arus kas
  const masuk = data.filter(t => ['simpanan', 'angsuran', 'penjualan'].includes(t.jenis_transaksi))
  const keluar = data.filter(t => ['pinjaman', 'pembelian', 'biaya_operasional'].includes(t.jenis_transaksi))

  const totalMasuk = masuk.reduce((s, t) => s + (t.total_amount || 0), 0)
  const totalKeluar = keluar.reduce((s, t) => s + (t.total_amount || 0), 0)
  const netArusKas = totalMasuk - totalKeluar

  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const cetakWaktu = new Date().toLocaleString('id-ID')
  const BULAN_LABEL = ['Semua', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const jenisBadge: Record<string, string> = {
    simpanan: 'bg-green-100 text-green-700',
    angsuran: 'bg-blue-100 text-blue-700',
    penjualan: 'bg-teal-100 text-teal-700',
    pinjaman: 'bg-orange-100 text-orange-700',
    pembelian: 'bg-red-100 text-red-700',
    biaya_operasional: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Laporan Arus Kas</h1>
          <p className="text-gray-500 text-sm">Cash Flow — Kas Masuk &amp; Kas Keluar</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={bulan} onChange={e => setBulan(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20">
            {BULAN_LABEL.map((b, i) => <option key={i} value={i}>{b}</option>)}
          </select>
          <select value={tahun} onChange={e => setTahun(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20">
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-merah text-white rounded-lg text-sm hover:bg-merah-dark transition-colors">
            🖨️ Cetak
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-header hidden print:block">
        <h1>{koperasiNama}</h1>
        {koperasiAlamat && <p>{koperasiAlamat}</p>}
        <h2>LAPORAN ARUS KAS</h2>
        <p>Periode: {BULAN_LABEL[bulan]} {tahun}</p>
        <p style={{ fontSize: '9pt', marginTop: '4pt' }}>Dicetak: {cetakWaktu}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm text-green-700 font-medium">Total Kas Masuk</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{formatRp(totalMasuk)}</p>
          <p className="text-xs text-green-600 mt-1">{masuk.length} transaksi</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-700 font-medium">Total Kas Keluar</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{formatRp(totalKeluar)}</p>
          <p className="text-xs text-red-600 mt-1">{keluar.length} transaksi</p>
        </div>
        <div className={`${netArusKas >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-5`}>
          <p className={`text-sm font-medium ${netArusKas >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Arus Kas Bersih</p>
          <p className={`text-2xl font-bold mt-1 ${netArusKas >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
            {netArusKas < 0 ? '-' : ''}{formatRp(netArusKas)}
          </p>
          <p className={`text-xs mt-1 ${netArusKas >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {netArusKas >= 0 ? '✅ Positif' : '⚠️ Negatif'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Memuat...</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-3xl mb-2">💸</p>
            <p>Tidak ada transaksi untuk periode {BULAN_LABEL[bulan]} {tahun}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Tanggal</th>
                <th className="px-5 py-3 text-left">Jenis</th>
                <th className="px-5 py-3 text-left">Keterangan</th>
                <th className="px-5 py-3 text-left">Unit</th>
                <th className="px-5 py-3 text-right text-green-700">Kas Masuk</th>
                <th className="px-5 py-3 text-right text-red-600">Kas Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map(tx => {
                const isMasuk = ['simpanan', 'angsuran', 'penjualan'].includes(tx.jenis_transaksi)
                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${jenisBadge[tx.jenis_transaksi] || 'bg-gray-100 text-gray-700'}`}>
                        {tx.jenis_transaksi.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 text-xs">{tx.keterangan || '-'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{tx.unit_usaha?.nama_unit || '-'}</td>
                    <td className="px-5 py-3 text-right font-mono text-green-600 font-medium">
                      {isMasuk ? formatRp(tx.total_amount) : ''}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-red-500 font-medium">
                      {!isMasuk ? formatRp(tx.total_amount) : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                <td colSpan={4} className="px-5 py-3 text-gray-700">TOTAL</td>
                <td className="px-5 py-3 text-right font-mono text-green-700">{formatRp(totalMasuk)}</td>
                <td className="px-5 py-3 text-right font-mono text-red-600">{formatRp(totalKeluar)}</td>
              </tr>
              <tr className={`${netArusKas >= 0 ? 'bg-blue-600' : 'bg-orange-600'} text-white`}>
                <td colSpan={4} className="px-5 py-3 font-bold">ARUS KAS BERSIH</td>
                <td colSpan={2} className="px-5 py-3 text-right font-mono font-bold text-lg">
                  {netArusKas < 0 ? '- ' : ''}{formatRp(netArusKas)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
