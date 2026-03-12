/**
 * Logger terpusat untuk error handling dan monitoring
 * REL-001 FIX: Structured error logging — memudahkan debugging di produksi
 *
 * Saat ini menggunakan console.error terstruktur.
 * Untuk produksi penuh: ganti `sendToMonitoring` dengan Sentry / LogRocket / dll.
 */

type LogLevel = 'error' | 'warn' | 'info'

interface LogEntry {
  level: LogLevel
  context: string       // misal: 'AnggotaPage.handleSave', 'saveTransaction'
  message: string
  error?: unknown
  meta?: Record<string, unknown>
}

function formatError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  if (typeof error === 'string') return error
  try { return JSON.stringify(error) } catch { return String(error) }
}

/**
 * Kirim ke monitoring service (Sentry, dll.)
 * TODO: Ganti implementasi ini jika Sentry/monitoring sudah dikonfigurasi
 */
function sendToMonitoring(_entry: LogEntry) {
  // Placeholder — integrasikan Sentry di sini:
  // import * as Sentry from '@sentry/nextjs'
  // if (entry.level === 'error' && entry.error instanceof Error) {
  //   Sentry.captureException(entry.error, { extra: entry.meta })
  // }
}

/**
 * Log error dengan konteks terstruktur
 * Gunakan ini menggantikan `console.error` biasa di seluruh aplikasi
 */
export function logError(context: string, message: string, error?: unknown, meta?: Record<string, unknown>) {
  const entry: LogEntry = { level: 'error', context, message, error, meta }

  // Structured log ke console (terlihat di Vercel Function Logs)
  console.error(JSON.stringify({
    level: 'ERROR',
    context,
    message,
    error: error ? formatError(error) : undefined,
    stack: error instanceof Error ? error.stack : undefined,
    meta,
    timestamp: new Date().toISOString(),
  }))

  sendToMonitoring(entry)
}

export function logWarn(context: string, message: string, meta?: Record<string, unknown>) {
  console.warn(JSON.stringify({
    level: 'WARN',
    context,
    message,
    meta,
    timestamp: new Date().toISOString(),
  }))
}

export function logInfo(context: string, message: string, meta?: Record<string, unknown>) {
  // Info log hanya di development, tidak spam di production
  if (process.env.NODE_ENV === 'development') {
    console.info(`[INFO] [${context}] ${message}`, meta || '')
  }
}

/**
 * Map database/Supabase error message ke pesan user-friendly
 * REL-002 FIX: Jangan tampilkan detail internal DB ke user
 */
export function mapDbErrorToUserMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)

  // Constraint violations
  if (msg.includes('anggota_nama_not_empty'))    return 'Nama anggota tidak boleh kosong'
  if (msg.includes('koperasi_nama_not_empty'))   return 'Nama koperasi tidak boleh kosong'
  if (msg.includes('transactions_amount_positive') || msg.includes('amount_positive'))
    return 'Jumlah transaksi harus lebih dari 0'
  if (msg.includes('journal_items_debit') || msg.includes('journal_items_credit'))
    return 'Nilai debit/kredit tidak boleh negatif'
  if (msg.includes('unique') || msg.includes('duplicate'))
    return 'Data sudah ada, periksa apakah sudah pernah diinput'
  if (msg.includes('foreign key') || msg.includes('violates foreign'))
    return 'Data tidak valid — referensi tidak ditemukan'
  if (msg.includes('row-level security') || msg.includes('RLS') || msg.includes('policy'))
    return 'Akses ditolak — Anda tidak memiliki izin untuk operasi ini'
  if (msg.includes('JWT') || msg.includes('token') || msg.includes('auth'))
    return 'Sesi telah berakhir, silakan login kembali'
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout'))
    return 'Koneksi terputus, coba lagi beberapa saat'
  if (msg.includes('tidak balance'))             return msg  // Sudah user-friendly
  if (msg.includes('Akses ditolak'))             return msg  // Sudah user-friendly

  // Default: jangan bocorkan detail teknis
  return 'Terjadi kesalahan. Silakan coba lagi atau hubungi admin.'
}
