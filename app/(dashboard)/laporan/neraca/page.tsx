'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function formatRp(n: number) {
  return `Rp ${Math.abs(n).toLocaleString('id-ID')}`
}

export default function NeracaPage() {
  const [data, setData] = useState<any>({ aset: [], kewajiban: [], modal: [], totalAset: 0, totalKewajiban: 0, totalModal: 0 })
  const [loading, setLoading] = useState(true)
  const [koperasiNama, setKoperasiNama] = useState('')
  const [koperasiAlamat, setKoperasiAlamat] = useState('')

  useEffect(() => { loadNeraca() }, [])

  async function loadNeraca() {
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

    const { data: neracaData } = await supabase
      .from('v_neraca')
      .select('*')
      .eq('koperasi_id', userData.koperasi_id)
      .order('kode_akun')

    const rows = neracaData || []
    const aset = rows.filter(a => a.kategori === 'aset')
    const kewajiban = rows.filter(a => a.kategori === 'kewajiban')
    const modal = rows.filter(a => a.kategori === 'modal')

    setData({
      aset, kewajiban, modal,
      totalAset: aset.reduce((s: number, a: any) => s + (a.saldo || 0), 0),
      totalKewajiban: kewajiban.reduce((s: number, a: any) => s + (a.saldo || 0), 0),
      totalModal: modal.reduce((s: number, a: any) => s + (a.saldo || 0), 0),
    })
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center py-16 text-gray-400">Memuat neraca...</div>

  const pasiva = data.totalKewajiban + data.totalModal
  const balanced = Math.abs(data.totalAset - pasiva) < 1
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const cetakWaktu = new Date().toLocaleString('id-ID')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Neraca</h1>
          <p className="text-gray-500 text-sm">Posisi keuangan per {today}</p>
        </div>
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-merah text-white rounded-lg text-sm hover:bg-merah-dark transition-colors flex items-center gap-2">
          🖨️ Cetak Neraca
        </button>
      </div>

      {/* Balance indicator */}
      <div className={`px-4 py-3 rounded-lg text-sm font-medium no-print ${balanced ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
        {balanced ? '✅ Neraca Seimbang: Aktiva = Pasiva' : '⚠️ Neraca Tidak Seimbang — Periksa jurnal Anda'}
      </div>

      {/* Print header (hanya muncul saat print) */}
      <div className="print-header hidden print:block">
        <h1>{koperasiNama}</h1>
        {koperasiAlamat && <p>{koperasiAlamat}</p>}
        <h2>NERACA</h2>
        <p>Per {today}</p>
        <p style={{ fontSize: '9pt', marginTop: '4pt' }}>Dicetak: {cetakWaktu}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header laporan */}
        <div className="text-center py-6 border-b border-gray-100 print:hidden">
          <p className="font-semibold text-gray-900 text-lg">{koperasiNama}</p>
          {koperasiAlamat && <p className="text-xs text-gray-400 mt-0.5">{koperasiAlamat}</p>}
          <p className="font-display text-xl text-gray-900 mt-2">NERACA</p>
          <p className="text-sm text-gray-500">Per {today}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* AKTIVA */}
          <div>
            <div className="bg-blue-50 px-6 py-2.5">
              <h3 className="font-semibold text-blue-800 text-sm uppercase tracking-wide">AKTIVA</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-6 py-2 font-medium text-gray-700 text-xs uppercase">Aset Lancar & Tidak Lancar</td>
                </tr>
                {data.aset.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-400 text-xs">Belum ada akun aset</td></tr>
                ) : data.aset.map((a: any) => (
                  <tr key={a.account_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-2 text-gray-600">
                      <span className="font-mono text-xs text-gray-400 mr-2">{a.kode_akun}</span>
                      {a.nama_akun}
                    </td>
                    <td className="px-6 py-2 text-right font-mono text-gray-900">{formatRp(a.saldo)}</td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-semibold border-t border-blue-100">
                  <td className="px-6 py-3 text-blue-800">TOTAL AKTIVA</td>
                  <td className="px-6 py-3 text-right font-mono text-blue-900 text-base">{formatRp(data.totalAset)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PASIVA */}
          <div>
            <div className="bg-green-50 px-6 py-2.5">
              <h3 className="font-semibold text-green-800 text-sm uppercase tracking-wide">PASIVA</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-6 py-2 font-medium text-gray-700 text-xs uppercase">Kewajiban</td>
                </tr>
                {data.kewajiban.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-400 text-xs">Belum ada akun kewajiban</td></tr>
                ) : data.kewajiban.map((a: any) => (
                  <tr key={a.account_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-2 text-gray-600">
                      <span className="font-mono text-xs text-gray-400 mr-2">{a.kode_akun}</span>
                      {a.nama_akun}
                    </td>
                    <td className="px-6 py-2 text-right font-mono text-gray-900">{formatRp(a.saldo)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={2} className="px-6 py-2 font-medium text-gray-700 text-xs uppercase">Modal / Ekuitas</td>
                </tr>
                {data.modal.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-400 text-xs">Belum ada akun modal</td></tr>
                ) : data.modal.map((a: any) => (
                  <tr key={a.account_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-2 text-gray-600">
                      <span className="font-mono text-xs text-gray-400 mr-2">{a.kode_akun}</span>
                      {a.nama_akun}
                    </td>
                    <td className="px-6 py-2 text-right font-mono text-gray-900">{formatRp(a.saldo)}</td>
                  </tr>
                ))}
                <tr className="bg-green-50 font-semibold border-t border-green-100">
                  <td className="px-6 py-3 text-green-800">TOTAL PASIVA</td>
                  <td className="px-6 py-3 text-right font-mono text-green-900 text-base">{formatRp(pasiva)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Balance check row */}
        <div className={`px-6 py-3 text-center text-xs font-medium border-t ${balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          Aktiva {formatRp(data.totalAset)} {balanced ? '=' : '≠'} Pasiva {formatRp(pasiva)}
          {!balanced && ` — Selisih: ${formatRp(Math.abs(data.totalAset - pasiva))}`}
        </div>
      </div>
    </div>
  )
}
