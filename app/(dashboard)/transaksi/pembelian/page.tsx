'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logError, mapDbErrorToUserMessage } from '@/lib/utils/logger'
import { saveTransaction, validateJournal, getTodayLocal } from '@/lib/accounting/journal-engine'
import { useAuth } from '@/hooks/useAuth'

export default function PembelianPage() {
  const { koperasiId, userId, loading: authLoading } = useAuth()
  const savingRef = useRef(false) // BUG-003 FIX: prevent double submit
  const [unitList, setUnitList]       = useState<any[]>([])
  const [accountList, setAccountList] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    unit_usaha_id: '', tanggal: getTodayLocal(),
    keterangan: '', total_amount: '',
    akun_beban_id: '', akun_kas_id: '',
  })

  useEffect(() => {
    if (!authLoading && koperasiId) loadData()
  }, [authLoading, koperasiId])

  async function loadData() {
    const supabase = createClient()
    const [unit, accounts, tx] = await Promise.all([
      supabase.from('unit_usaha').select('id, nama_unit').eq('koperasi_id', koperasiId).eq('status', 'aktif'),
      supabase.from('accounts').select('id, kode_akun, nama_akun, kategori').eq('koperasi_id', koperasiId).order('kode_akun'),
      supabase.from('transactions').select('*, unit_usaha(nama_unit)')
        .eq('koperasi_id', koperasiId).eq('jenis_transaksi', 'pembelian')
        .order('created_at', { ascending: false }).limit(15),
    ])
    setUnitList(unit.data || [])
    setAccountList(accounts.data || [])
    setTransactions(tx.data || [])
    setLoading(false)
  }

  async function handleSimpan() {
    if (savingRef.current) return // BUG-003: prevent double submit
    if (!form.unit_usaha_id || !form.total_amount || !form.akun_beban_id || !form.akun_kas_id) {
      setError('Lengkapi semua field yang diperlukan'); return
    }
    const amount = parseFloat(form.total_amount)
    if (isNaN(amount) || amount <= 0) { setError('Jumlah pembelian harus lebih dari 0'); return }

    const journalEntries = [
      { account_id: form.akun_beban_id, debit: amount, credit: 0 },
      { account_id: form.akun_kas_id,   debit: 0,      credit: amount },
    ]
    const validation = validateJournal(journalEntries)
    if (!validation.valid) { setError(validation.message || ''); return }

    if (savingRef.current) return
    setSaving(true)
    savingRef.current = true
    setError('')
    try {
      await saveTransaction({
        koperasi_id: koperasiId, unit_usaha_id: form.unit_usaha_id,
        jenis_transaksi: 'pembelian', tanggal: form.tanggal,
        keterangan: form.keterangan || 'Pembelian barang / jasa',
        total_amount: amount, created_by: userId,
        journal_entries: journalEntries,
      })
      setSuccess(`Pembelian berhasil dicatat! Rp ${amount.toLocaleString('id-ID')}`)
      setForm(prev => ({ ...prev, total_amount: '', keterangan: '' }))
      loadData()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      setError(mapDbErrorToUserMessage(err))
      logError('pembelianPage.handleSimpan', 'Failed to save transaction', err)
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  const kasAccounts   = accountList.filter(a => a.kategori === 'aset' && (a.nama_akun.toLowerCase().includes('kas') || a.nama_akun.toLowerCase().includes('bank')))
  const bebanAccounts = accountList.filter(a => a.kategori === 'beban')
  const asetAccounts  = accountList.filter(a => a.kategori === 'aset')

  if (authLoading || loading) return <div className="flex items-center justify-center py-16 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-gray-900">Transaksi Pembelian</h1>
        <p className="text-gray-500 text-sm">Catat pembelian barang atau jasa koperasi</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Form Pembelian</h3>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Usaha *</label>
              <select value={form.unit_usaha_id} onChange={e => setForm({ ...form, unit_usaha_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah">
                <option value="">Pilih Unit Usaha...</option>
                {unitList.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Pembelian (Rp) *</label>
              <input type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })}
                placeholder="0" min="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">⚙️ Mapping Jurnal</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Akun Beban / Persediaan (Debit)</label>
                <select value={form.akun_beban_id} onChange={e => setForm({ ...form, akun_beban_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-merah/20">
                  <option value="">Pilih akun beban...</option>
                  {(bebanAccounts.length > 0 ? bebanAccounts : accountList).map(a =>
                    <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Akun Kas/Bank (Kredit)</label>
                <select value={form.akun_kas_id} onChange={e => setForm({ ...form, akun_kas_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-merah/20">
                  <option value="">Pilih akun kas...</option>
                  {(kasAccounts.length > 0 ? kasAccounts : asetAccounts).map(a =>
                    <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>)}
                </select>
              </div>
            </div>
            {form.total_amount && parseFloat(form.total_amount) > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs">
                <p className="font-medium text-blue-800 mb-2">Preview Jurnal:</p>
                <div className="font-mono space-y-1 text-blue-700">
                  <div className="flex justify-between"><span>DR Beban/Persediaan</span><span>Rp {parseFloat(form.total_amount).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between pl-4"><span>CR Kas/Bank</span><span>Rp {parseFloat(form.total_amount).toLocaleString('id-ID')}</span></div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <input type="text" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Nama barang / keterangan pembelian..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-merah/20 focus:border-merah" />
            </div>
            <button onClick={handleSimpan} disabled={saving}
              className="w-full bg-merah hover:bg-merah-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {saving ? 'Memproses...' : 'Catat Pembelian & Buat Jurnal'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Riwayat Pembelian</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Keterangan</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs">Belum ada pembelian</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(tx.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{tx.keterangan || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 font-medium">
                    Rp {tx.total_amount?.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
