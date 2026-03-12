/**
 * Journal Engine — Mesin Jurnal Akuntansi Otomatis
 * FIX: Semua transaksi sekarang menggunakan stored procedure (atomic, ACID)
 * FIX: BUG-004 Floating point dihindari dengan decimal.js (presisi penuh)
 * FIX: parseRupiah diperbaiki untuk format IDR yang benar
 */

import { createClient } from '@/lib/supabase/client'
import Decimal from 'decimal.js'
import { logError, mapDbErrorToUserMessage } from '@/lib/utils/logger'

// Konfigurasi Decimal untuk akuntansi (presisi tinggi, tidak ada notasi ilmiah)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -9, toExpPos: 20 })

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
 * FIX BUG-004: Gunakan Decimal.js untuk menghindari floating point imprecision
 */
export function validateJournal(entries: JournalEntry[]): { valid: boolean; message?: string } {
  if (entries.length < 2) {
    return { valid: false, message: 'Jurnal harus memiliki minimal 2 entri' }
  }

  // FIX BUG-004: Decimal.js — menghindari 0.1 + 0.2 = 0.30000000000004
  const totalDebit  = entries.reduce((sum, e) => sum.plus(new Decimal(e.debit  || 0)), new Decimal(0))
  const totalCredit = entries.reduce((sum, e) => sum.plus(new Decimal(e.credit || 0)), new Decimal(0))
  const diff = totalDebit.minus(totalCredit).abs()

  if (diff.greaterThan(new Decimal('0.001'))) {
    return {
      valid: false,
      message: `Jurnal tidak balance: Total Debit (${formatRupiah(totalDebit.toNumber())}) ≠ Total Kredit (${formatRupiah(totalCredit.toNumber())})`,
    }
  }

  // Validate no negative values
  for (const e of entries) {
    if (e.debit < 0 || e.credit < 0) {
      return { valid: false, message: 'Nilai debit dan kredit tidak boleh negatif' }
    }
  }

  return { valid: true }
}

/**
 * Simpan transaksi beserta jurnal ke database menggunakan stored procedure (ATOMIC)
 * FIX: Single RPC call — either all succeeds or all rolls back (ACID)
 * FIX: Server-side validates account ownership to prevent cross-koperasi manipulation
 */
export async function saveTransaction(input: TransactionInput) {
  // Client-side pre-validation
  const validation = validateJournal(input.journal_entries)
  if (!validation.valid) {
    throw new Error(validation.message)
  }

  if (input.total_amount <= 0) {
    throw new Error('Jumlah transaksi harus lebih dari 0')
  }

  const supabase = createClient()

  // Single atomic RPC call — replaces 3 separate INSERT calls
  const { data, error } = await supabase.rpc('create_transaction_with_journal', {
    p_koperasi_id:     input.koperasi_id,
    p_unit_usaha_id:   input.unit_usaha_id,
    p_anggota_id:      input.anggota_id || null,
    p_jenis_transaksi: input.jenis_transaksi,
    p_tanggal:         input.tanggal,
    p_keterangan:      input.keterangan,
    p_total_amount:    input.total_amount,
    p_created_by:      input.created_by,
    p_journal_entries: input.journal_entries,
  })

  if (error) {
    // REL-001: Log error terstruktur untuk debugging produksi
    logError('saveTransaction', 'RPC create_transaction_with_journal failed', error, {
      jenis: input.jenis_transaksi,
      koperasi_id: input.koperasi_id,
    })
    // REL-002: Tampilkan pesan user-friendly, bukan detail internal DB
    throw new Error(mapDbErrorToUserMessage(error))
  }

  return data as { transaction_id: string; journal_id: string }
}

/**
 * Ambil akun berdasarkan kode
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
 * Parse string ke angka (format Rupiah Indonesia)
 * FIX: Format IDR menggunakan titik sebagai pemisah ribuan, koma sebagai desimal
 * Contoh: "Rp 1.500.000,50" → 1500000.5
 */
export function parseRupiah(value: string): number {
  // Hapus simbol mata uang dan spasi
  const cleaned = value.replace(/[^0-9,.]/g, '')
  // Format IDR: titik = pemisah ribuan, koma = desimal
  // Hapus semua titik (ribuan), ganti koma terakhir dengan titik (desimal)
  const normalized = cleaned.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Dapatkan tanggal hari ini dalam timezone lokal (format YYYY-MM-DD)
 * FIX: new Date().toISOString() menggunakan UTC dan bisa salah hari di WIB
 */
export function getTodayLocal(): string {
  return new Date().toLocaleDateString('sv-SE') // Returns YYYY-MM-DD in local timezone
}
