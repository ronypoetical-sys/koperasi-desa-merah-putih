'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function formatRp(n: number) {
  return `Rp ${Math.abs(n).toLocaleString('id-ID')}`
}

export default function SHUPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [koperasiNama, setKoperasiNama] = useState('')
  const [koperasiAlamat, setKoperasiAlamat] = useState('')

  useEffect(() => { loadData() }, [tahun])

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
    setKoperasiAlamat([kop?.alamat, kop?.desa, kop?.kecamatan, kop?.kabupaten, kop?.provinsi].filter(Boolean).join(', '))

    const { data: shuData } = await supabase
      .from('v_shu')
      .select('*')
      .eq('koperasi_id', userData.koperasi_id)
      .eq('tahun', tahun)
    setData(shuData || [])
    setLoading(false)
  }

  // Agregasi per unit usaha
  const perUnit: Record<string, { nama: string; pendapatan: number; beban: number }> = {}
  data.forEach(row => {
    if (!perUnit[row.unit_usaha_id]) perUnit[row.unit_usaha_id] = { nama: row.nama_unit, pendapatan: 0, beban: 0 }
    perUnit[row.unit_usaha_id].pendapatan += row.pendapatan || 0
    perUnit[row.unit_usaha_id].beban += row.beban || 0
  })

  const unitEntries = Object.entries(perUnit)
  const totalPendapatan = unitEntries.reduce((s, [, u]) => s + u.pendapatan, 0)
  const totalBeban = unitEntries.reduce((s, [, u]) => s + u.beban, 0)
  const shuBersih = totalPendapatan - totalBeban
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const cetakWaktu = new Date().toLocaleString('id-ID')
  const tahunOptions = [2023, 2024, 2025, 2026, 2027]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Laporan SHU</h1>
          <p className="text-gray-500 text-sm">Sisa Hasil Usaha — Laba Rugi Koperasi</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={tahun} onChange={e => setTahun(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20">
            {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-merah text-white rounded-lg text-sm hover:bg-merah-dark transition-colors flex items-center gap-2">
            🖨️ Cetak Laporan
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-header hidden print:block">
        <h1>{koperasiNama}</h1>
        {koperasiAlamat && <p>{koperasiAlamat}</p>}
        <h2>LAPORAN SISA HASIL USAHA (SHU)</h2>
        <p>Tahun Buku {tahun}</p>
        <p style={{ fontSize: '9pt', marginTop: '4pt' }}>Dicetak: {cetakWaktu}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header on screen */}
        <div className="text-center py-6 border-b border-gray-100 print:hidden">
          <p className="font-semibold text-gray-900 text-lg">{koperasiNama}</p>
          {koperasiAlamat && <p className="text-xs text-gray-400">{koperasiAlamat}</p>}
          <p className="font-display text-xl text-gray-900 mt-2">LAPORAN SISA HASIL USAHA (SHU)</p>
          <p className="text-sm text-gray-500">Tahun Buku {tahun}</p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Unit Usaha / Keterangan</th>
                <th className="px-6 py-3 text-right">Pendapatan</th>
                <th className="px-6 py-3 text-right">Beban</th>
                <th className="px-6 py-3 text-right">SHU Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-green-50">
                <td colSpan={4} className="px-6 py-2 font-semibold text-green-800 text-xs uppercase">
                  I. PENDAPATAN &amp; BEBAN PER UNIT USAHA
                </td>
              </tr>
              {unitEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    Belum ada data SHU untuk tahun {tahun}
                  </td>
                </tr>
              ) : unitEntries.map(([id, u]) => {
                const shuUnit = u.pendapatan - u.beban
                return (
                  <tr key={id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700 font-medium">{u.nama}</td>
                    <td className="px-6 py-3 text-right font-mono text-green-600">{formatRp(u.pendapatan)}</td>
                    <td className="px-6 py-3 text-right font-mono text-red-500">{formatRp(u.beban)}</td>
                    <td className={`px-6 py-3 text-right font-mono font-medium ${shuUnit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {shuUnit < 0 ? '-' : ''}{formatRp(shuUnit)}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-6 py-3 text-gray-900">TOTAL KONSOLIDASI</td>
                <td className="px-6 py-3 text-right font-mono text-green-700">{formatRp(totalPendapatan)}</td>
                <td className="px-6 py-3 text-right font-mono text-red-600">{formatRp(totalBeban)}</td>
                <td className={`px-6 py-3 text-right font-mono text-lg font-bold ${shuBersih >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {shuBersih < 0 ? '-' : ''}{formatRp(shuBersih)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className={`${shuBersih >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                <td colSpan={3} className="px-6 py-4 font-bold text-base">
                  SHU BERSIH KOPERASI TAHUN {tahun}
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-xl">
                  {shuBersih < 0 ? '- ' : ''}{formatRp(shuBersih)}
                  {shuBersih < 0 && ' (RUGI)'}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
