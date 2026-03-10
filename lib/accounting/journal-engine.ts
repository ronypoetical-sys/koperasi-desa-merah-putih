/**
 * Journal Engine - Mesin Jurnal Akuntansi Otomatis
 * Setiap transaksi menghasilkan entri jurnal yang balance (debit = credit)
 */

import { createClient } from '@/lib/supabase/client'

export type JournalEntry = {
  account_id: string
  debit: number
  credit: number
}

export type TransactionInput = {
  koperasi_id: string
  unit_usaha_id: string
  anggota_id?: string
  jenis_transaksi: 'simpanan' | 'penarikan_simpanan' | 'pinjaman' | 'angsuran' | 'penjualan' | 'pembelian' | 'biaya_operasional' | 'lainnya'
  tanggal: string
  keterangan: string
  total_amount: number
  created_by: string
  journal_entries: JournalEntry[]
}

/**
 * Validasi jurnal: total debit harus sama dengan total credit
 */
export function validateJournal(entries: JournalEntry[]): { valid: boolean; message?: string } {
  if (entries.length < 2) {
    return { valid: false, message: 'Jurnal harus memiliki minimal 2 entri' }
  }

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      valid: false,
      message: `Jurnal tidak balance: Total Debit (${formatRupiah(totalDebit)}) ≠ Total Credit (${formatRupiah(totalCredit)})`
    }
  }

  return { valid: true }
}

/**
 * Simpan transaksi beserta jurnal ke database
 */
export async function saveTransaction(input: TransactionInput) {
  // 1. Validasi jurnal balance
  const validation = validateJournal(input.journal_entries)
  if (!validation.valid) {
    throw new Error(validation.message)
  }

  const supabase = createClient()

  // 2. Insert transaksi
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      koperasi_id: input.koperasi_id,
      unit_usaha_id: input.unit_usaha_id,
      anggota_id: input.anggota_id,
      jenis_transaksi: input.jenis_transaksi,
      tanggal: input.tanggal,
      keterangan: input.keterangan,
      total_amount: input.total_amount,
      created_by: input.created_by,
    })
    .select()
    .single()

  if (txError) throw new Error(`Gagal menyimpan transaksi: ${txError.message}`)

  // 3. Insert jurnal
  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .insert({
      transaction_id: transaction.id,
      tanggal: input.tanggal,
      unit_usaha_id: input.unit_usaha_id,
      keterangan: input.keterangan,
    })
    .select()
    .single()

  if (journalError) throw new Error(`Gagal menyimpan jurnal: ${journalError.message}`)

  // 4. Insert detail jurnal
  const journalItems = input.journal_entries.map(entry => ({
    journal_id: journal.id,
    account_id: entry.account_id,
    debit: entry.debit,
    credit: entry.credit,
  }))

  const { error: itemsError } = await supabase
    .from('journal_items')
    .insert(journalItems)

  if (itemsError) throw new Error(`Gagal menyimpan detail jurnal: ${itemsError.message}`)

  return { transaction, journal }
}

/**
 * Ambil akun berdasarkan kode untuk kemudahan pembuatan jurnal
 */
export async function getAccountByKode(koperasi_id: string, kode_akun: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('id, kode_akun, nama_akun, kategori')
    .eq('koperasi_id', koperasi_id)
    .eq('kode_akun', kode_akun)
    .single()

  if (error) throw new Error(`Akun ${kode_akun} tidak ditemukan`)
  return data
}

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parse string Rupiah ke angka
 */
export function parseRupiah(value: string): number {
  return parseFloat(value.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0
}
