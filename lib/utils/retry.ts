/**
 * Retry utility untuk operasi jaringan yang gagal
 * REL-003 FIX: Automatic retry dengan exponential backoff
 */

interface RetryOptions {
  maxAttempts?: number     // Default: 3
  initialDelayMs?: number  // Default: 500ms
  maxDelayMs?: number      // Default: 5000ms
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

/**
 * Jalankan fungsi dengan automatic retry dan exponential backoff.
 *
 * Contoh:
 *   const data = await withRetry(() => supabase.from('x').select('*'), { maxAttempts: 3 })
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 500,
    maxDelayMs = 5000,
    shouldRetry = isRetryableError,
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Jangan retry jika ini attempt terakhir atau error tidak retryable
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms, ...
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs)
      await sleep(delay)
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Cek apakah error layak untuk di-retry
 * Jangan retry error logic (auth, validation, dll.)
 */
function isRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // Error yang TIDAK perlu di-retry (logika/auth error)
  const nonRetryable = [
    'jwt', 'token', 'auth', 'unauthorized', 'forbidden',
    'row-level security', 'permission', 'tidak balance',
    'tidak valid', 'validation', 'constraint',
    'duplicate', 'unique', 'foreign key',
    'akses ditolak',
  ]
  if (nonRetryable.some(kw => msg.includes(kw))) return false

  // Error yang LAYAK di-retry (network/temporary)
  const retryable = [
    'network', 'timeout', 'fetch', 'connection',
    'econnreset', 'econnrefused', 'socket',
    '500', '502', '503', '504',
    'service unavailable', 'bad gateway',
  ]
  return retryable.some(kw => msg.includes(kw))
}
