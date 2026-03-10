'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BukuBesarPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [koperasiId, setKoperasiId] = useState('')
  const [koperasiNama, setKoperasiNama] = useState('')
  const [koperasiAlamat, setKoperasiAlamat] = useState('')

  useEffect(() => { loadAccounts() }, [])
  useEffect(() => { if (selectedAccount && koperasiId) loadBukuBesar() }, [selectedAccount, koperasiId])

  async function loadAccounts() {
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
    setKoperasiAlamat([kop?.alamat, kop?.desa, kop?.kecamatan, kop?.kabupaten].filter(Boolean).join(', '))

    const { data } = await supabase
      .from('accounts')
      .select('id, kode_akun, nama_akun, kategori')
      .eq('koperasi_id', userData.koperasi_id)
      .order('kode_akun')
    setAccounts(data || [])
  }

  async function loadBukuBesar() {
    if (!selectedAccount || !koperasiId) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('v_buku_besar')
      .select('*')
      .eq('koperasi_id', koperasiId)
      .eq('account_id', selectedAccount)
      .order('tanggal')
    setEntries(data || [])
    setLoading(false)
  }

  const selectedAkun = accounts.find(a => a.id === selectedAccount)
  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0)
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0)
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const cetakWaktu = new Date().toLocaleString('id-ID')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-display text-gray-900">Buku Besar</h1>
          <p className="text-gray-500 text-sm">Mutasi dan saldo per akun</p>
        </div>
        {selectedAccount && entries.length > 0 && (
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-merah text-white rounded-lg text-sm hover:bg-merah-dark transition-colors">
            🖨️ Cetak Buku Besar
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 no-print">
        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Akun</label>
        <select
          value={selectedAccount}
          onChange={e => setSelectedAccount(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah"
        >
          <option value="">Pilih Akun...</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.kode_akun} — {a.nama_akun}</option>
          ))}
        </select>
      </div>

      {selectedAccount && (
        <>
          {/* Print header */}
          <div className="print-header hidden print:block">
            <h1>{koperasiNama}</h1>
            {koperasiAlamat && <p>{koperasiAlamat}</p>}
            <h2>BUKU BESAR</h2>
            <p>Akun: {selectedAkun?.kode_akun} — {selectedAkun?.nama_akun}</p>
            <p>Per {today} — Dicetak: {cetakWaktu}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <p className="font-semibold text-gray-900">{selectedAkun?.kode_akun} — {selectedAkun?.nama_akun}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{selectedAkun?.kategori}</p>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-400">Memuat...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">Tanggal</th>
                    <th className="px-6 py-3 text-left">Keterangan</th>
                    <th className="px-6 py-3 text-left">Unit</th>
                    <th className="px-6 py-3 text-right">Debit (Rp)</th>
                    <th className="px-6 py-3 text-right">Kredit (Rp)</th>
                    <th className="px-6 py-3 text-right">Saldo (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                        Belum ada mutasi untuk akun ini
                      </td>
                    </tr>
                  ) : entries.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(e.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{e.keterangan || '-'}</td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{e.nama_unit || '-'}</td>
                      <td className="px-6 py-3 text-right font-mono text-gray-900">
                        {e.debit > 0 ? e.debit.toLocaleString('id-ID') : ''}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-gray-500">
                        {e.credit > 0 ? e.credit.toLocaleString('id-ID') : ''}
                      </td>
                      <td className={`px-6 py-3 text-right font-mono font-medium ${(e.saldo_berjalan ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(e.saldo_berjalan ?? 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                    <td colSpan={3} className="px-6 py-3 text-gray-700">TOTAL</td>
                    <td className="px-6 py-3 text-right font-mono text-gray-900">
                      {totalDebit.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-gray-500">
                      {totalCredit.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-green-700 font-bold">
                      {Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
