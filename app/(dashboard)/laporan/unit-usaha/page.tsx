'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function formatRp(n: number) { return `Rp ${Math.abs(n).toLocaleString('id-ID')}` }

export default function LaporanUnitUsahaPage() {
  const [units, setUnits] = useState<any[]>([])
  const [shuData, setShuData] = useState<any[]>([])
  const [txData, setTxData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [koperasiNama, setKoperasiNama] = useState('')

  useEffect(() => { loadData() }, [tahun])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user) return
    const { data: userData } = await supabase
      .from('users')
      .select('koperasi_id, koperasi(nama_koperasi)')
      .eq('id', authUser.user.id)
      .single() as any
    if (!userData?.koperasi_id) return

    setKoperasiNama((userData.koperasi as any)?.nama_koperasi || '')

    const [unitRes, shuRes, txRes] = await Promise.all([
      supabase.from('unit_usaha').select('*').eq('koperasi_id', userData.koperasi_id).order('nama_unit'),
      supabase.from('v_shu').select('*').eq('koperasi_id', userData.koperasi_id).eq('tahun', tahun),
      supabase.from('transactions').select('unit_usaha_id, total_amount, jenis_transaksi')
        .eq('koperasi_id', userData.koperasi_id)
        .gte('tanggal', `${tahun}-01-01`).lte('tanggal', `${tahun}-12-31`)
    ])

    setUnits(unitRes.data || [])
    setShuData(shuRes.data || [])
    setTxData(txRes.data || [])
    setLoading(false)
  }

  // Build per-unit stats
  const unitStats = units.map(u => {
    const shu = shuData.filter(s => s.unit_usaha_id === u.id)
    const tx = txData.filter(t => t.unit_usaha_id === u.id)
    const pendapatan = shu.reduce((s, r) => s + (r.pendapatan || 0), 0)
    const beban = shu.reduce((s, r) => s + (r.beban || 0), 0)
    const totalTx = tx.length
    const totalOmzet = tx.reduce((s, t) => s + (t.total_amount || 0), 0)
    return { ...u, pendapatan, beban, shu: pendapatan - beban, totalTx, totalOmzet }
  })

  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Laporan Unit Usaha</h1>
          <p className="text-gray-500 text-sm">Kinerja per unit usaha tahun {tahun}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={tahun} onChange={e => setTahun(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20">
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-merah text-white rounded-lg text-sm hover:bg-merah-dark">
            🖨️ Cetak
          </button>
        </div>
      </div>

      <div className="print-header hidden print:block">
        <h1>{koperasiNama}</h1>
        <h2>LAPORAN KINERJA UNIT USAHA</h2>
        <p>Tahun {tahun} — Dicetak: {today}</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Memuat...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Unit Usaha</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Total Transaksi</th>
                <th className="px-6 py-3 text-right">Omzet</th>
                <th className="px-6 py-3 text-right">Pendapatan</th>
                <th className="px-6 py-3 text-right">Beban</th>
                <th className="px-6 py-3 text-right">SHU Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {unitStats.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">Belum ada unit usaha</td></tr>
              ) : unitStats.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{u.nama_unit}</p>
                    <p className="text-xs text-gray-400 font-mono">{u.kode_unit}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={u.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}>{u.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700">{u.totalTx.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700">{formatRp(u.totalOmzet)}</td>
                  <td className="px-6 py-4 text-right font-mono text-green-600">{formatRp(u.pendapatan)}</td>
                  <td className="px-6 py-4 text-right font-mono text-red-500">{formatRp(u.beban)}</td>
                  <td className={`px-6 py-4 text-right font-mono font-semibold ${u.shu >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {u.shu < 0 ? '-' : ''}{formatRp(u.shu)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                <td colSpan={2} className="px-6 py-3 text-gray-700">TOTAL</td>
                <td className="px-6 py-3 text-right font-mono">{unitStats.reduce((s, u) => s + u.totalTx, 0).toLocaleString('id-ID')}</td>
                <td className="px-6 py-3 text-right font-mono">{formatRp(unitStats.reduce((s, u) => s + u.totalOmzet, 0))}</td>
                <td className="px-6 py-3 text-right font-mono text-green-700">{formatRp(unitStats.reduce((s, u) => s + u.pendapatan, 0))}</td>
                <td className="px-6 py-3 text-right font-mono text-red-600">{formatRp(unitStats.reduce((s, u) => s + u.beban, 0))}</td>
                <td className="px-6 py-3 text-right font-mono text-gray-900">{formatRp(unitStats.reduce((s, u) => s + u.shu, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
