/**
 * Security utilities — SEC-007, SEC-008 FIX
 * Input sanitization and validation to prevent XSS and invalid data
 */

/**
 * Sanitize text input to prevent stored XSS
 * Removes/encodes potentially dangerous HTML characters
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Sanitize for plain text fields (strips all HTML-like tags)
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[<>&"'/]/g, '') // remove special chars
    .trim()
}

/**
 * Validate Indonesian NPWP format: XX.XXX.XXX.X-XXX.XXX
 * SEC-008 FIX: Proper NPWP validation
 */
export function validateNPWP(npwp: string): boolean {
  if (!npwp || npwp.trim() === '') return true // optional field
  const cleaned = npwp.replace(/[.\-\s]/g, '')
  return /^\d{15}$/.test(cleaned)
}

/**
 * Format NPWP as user types: 00.000.000.0-000.000
 */
export function formatNPWP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 15)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0,2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5)}`
  if (digits.length <= 9) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}.${digits.slice(8)}`
  if (digits.length <= 12) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}.${digits.slice(8,9)}-${digits.slice(9)}`
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}.${digits.slice(8,9)}-${digits.slice(9,12)}.${digits.slice(12)}`
}

/**
 * Validate NIK format (16 digits)
 */
export function validateNIK(nik: string): boolean {
  if (!nik || nik.trim() === '') return true // optional
  return /^\d{16}$/.test(nik.replace(/\s/g, ''))
}
