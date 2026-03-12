'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function JurnalPage() {
  const [journals, setJournals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [koperasiId, setKoperasiId] = useState('')
  const [koperasiNama, setKoperasiNama] = useState('')
  const [koperasiAlamat, setKoperasiAlamat] = useState('')
  const [filterTanggalDari, setFilterTanggalDari] = useState('')
  const [filterTanggalSampai, setFilterTanggalSampai] = useState('')

  useEffect(() => { loadJournals() }, [])

  async function loadJournals() {
    const supabase = createClient()
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user) return

    const { data: userData } = await supabase
      .from('users')
      .select('koperasi_id, koperasi(nama_koperasi, alamat, desa, kecamatan, kabupaten, provinsi)')
      .eq('id', authUser.user.id)
      .single() as any
    if (!userData?.koperasi_id) return

    setKoperasiId(userData.koperasi_id)
    const kop = userData.koperasi as any
    setKoperasiNama(kop?.nama_koperasi || '')
    setKoperasiAlamat([kop?.alamat, kop?.desa, kop?.kecamatan].filter(Boolean).join(', '))

    const unitIds = await supabase
      .from('unit_usaha')
      .select('id')
      .eq('koperasi_id', userData.koperasi_id)

    if (!unitIds.data || unitIds.data.length === 0) {
      setJournals([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('journals')
      .select(`
        *,
        unit_usaha(nama_unit),
        transactions(keterangan, jenis_transaksi, anggota(nama)),
        journal_items(
          debit, credit,
          accounts(kode_akun, nama_akun)
        )
      `)
      .in('unit_usaha_id', (unitIds.data as any[]).map((u: any) => u.id))
      .order('tanggal', { ascending: false })
      .limit(100)

    if (filterTanggalDari) query = query.gte('tanggal', filterTanggalDari)
    if (filterTanggalSampai) query = query.lte('tanggal', filterTanggalSampai)

    const { data } = await query
    setJournals(data || [])
    setLoading(false)
  }

  function handleFilter() { setLoading(true); loadJournals() }

  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const cetakWaktu = new Date().toLocaleString('id-ID')

  // Hitung totals
  const totalDebit = journals.reduce((s, j) =>
    s + (j.journal_items?.reduce((ss: number, i: any) => ss + (i.debit || 0), 0) || 0), 0)
  const totalCredit = journals.reduce((s, j) =>
    s + (j.journal_items?.reduce((ss: number, i: any) => ss + (i.credit || 0), 0) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Jurnal Umum</h1>
          <p className="text-gray-500 text-sm">Semua entri jurnal akuntansi koperasi</p>
        </div>
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-merah text-white rounded-lg text-sm hover:bg-merah-dark transition-colors flex items-center gap-2">
          🖨️ Cetak Jurnal
        </button>
      </div>

      {/* Filter tanggal */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-3 no-print">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Dari Tanggal</label>
          <input type="date" value={filterTanggalDari} onChange={e => setFilterTanggalDari(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sampai Tanggal</label>
          <input type="date" value={filterTanggalSampai} onChange={e => setFilterTanggalSampai(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
        </div>
        <button onClick={handleFilter}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700">
          Tampilkan
        </button>
        {(filterTanggalDari || filterTanggalSampai) && (
          <button onClick={() => { setFilterTanggalDari(''); setFilterTanggalSampai(''); setTimeout(loadJournals, 100) }}
            className="px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50">
            Reset
          </button>
        )}
      </div>

      {/* Print header */}
      <div className="print-header hidden print:block">
        <h1>{koperasiNama}</h1>
        {koperasiAlamat && <p>{koperasiAlamat}</p>}
        <h2>JURNAL UMUM</h2>
        <p>{filterTanggalDari && filterTanggalSampai
          ? `Periode: ${new Date(filterTanggalDari).toLocaleDateString('id-ID')} s/d ${new Date(filterTanggalSampai).toLocaleDateString('id-ID')}`
          : `Per {today}`}</p>
        <p style={{ fontSize: '9pt', marginTop: '4pt' }}>Dicetak: {cetakWaktu}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Memuat jurnal...</div>
        ) : journals.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-3xl mb-2">📒</p>
            <p>Belum ada jurnal. Mulai dengan mencatat transaksi pertama!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left w-28">Tanggal</th>
                <th className="px-4 py-3 text-left">Keterangan</th>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Akun</th>
                <th className="px-4 py-3 text-right">Debit (Rp)</th>
                <th className="px-4 py-3 text-right">Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {journals.map(journal => (
                journal.journal_items?.map((item: any, idx: number) => (
                  <tr key={`${journal.id}-${idx}`}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${idx === 0 ? 'border-t-2 border-t-gray-200' : ''}`}>
                    {idx === 0 && (
                      <td rowSpan={journal.journal_items.length} className="px-4 py-3 text-gray-500 text-xs align-top pt-4 border-r border-gray-100">
                        {new Date(journal.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={journal.journal_items.length} className="px-4 py-3 align-top pt-4 border-r border-gray-100">
                        <p className="text-gray-800 font-medium text-xs">
                          {journal.transactions?.keterangan || journal.keterangan || '-'}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">{journal.unit_usaha?.nama_unit}</p>
                      </td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={journal.journal_items.length} className="px-4 py-3 text-xs text-gray-400 align-top pt-4 border-r border-gray-100 font-mono">
                        {journal.transactions?.jenis_transaksi?.replace(/_/g, ' ') || '-'}
                      </td>
                    )}
                    <td className={`px-4 py-2 ${item.credit > 0 ? 'pl-10' : ''}`}>
                      <span className="font-mono text-gray-400 text-xs mr-2">{item.accounts?.kode_akun}</span>
                      <span className="text-gray-700">{item.accounts?.nama_akun}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-900 text-xs">
                      {item.debit > 0 ? item.debit.toLocaleString('id-ID') : ''}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-500 text-xs">
                      {item.credit > 0 ? item.credit.toLocaleString('id-ID') : ''}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                <td colSpan={4} className="px-4 py-3 text-gray-700">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono text-gray-900">
                  {totalDebit.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-500">
                  {totalCredit.toLocaleString('id-ID')}
                </td>
              </tr>
              <tr className={`text-xs ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <td colSpan={6} className="px-4 py-2 text-center font-medium">
                  {Math.abs(totalDebit - totalCredit) < 0.01
                    ? '✅ Jurnal balance — Total Debit = Total Kredit'
                    : `⚠️ Jurnal tidak balance — Selisih: Rp ${Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}`}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
