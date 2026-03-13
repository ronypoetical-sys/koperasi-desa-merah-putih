/**
 * BUG-008 FIX: Server-side validation for koperasi setup form
 * POST /api/setup — validates payload server-side before passing to Supabase
 *
 * Why needed: client-side validation can be bypassed (devtools, direct API calls).
 * This route validates and sanitizes all input at the server boundary.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// --- Validation helpers ---

function isNonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isValidYear(v: unknown): v is number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1900 && n <= 2100
}

function isValidNPWP(v: unknown): boolean {
  if (!v || v === '') return true // optional field
  const digits = String(v).replace(/\D/g, '')
  return digits.length === 15
}

function isValidDate(v: unknown): boolean {
  if (!v || v === '') return true // optional field
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v))
}

function sanitize(v: unknown): string {
  if (typeof v !== 'string') return ''
  // Strip HTML tags and null bytes
  return v.replace(/<[^>]*>/g, '').replace(/\0/g, '').trim()
}

// --- Route handler ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const errors: Record<string, string> = {}

    // Required fields
    if (!isNonEmpty(body.nama_koperasi)) {
      errors.nama_koperasi = 'Nama koperasi wajib diisi'
    } else if (sanitize(body.nama_koperasi).length > 200) {
      errors.nama_koperasi = 'Nama koperasi maksimal 200 karakter'
    }

    if (!isValidYear(body.tahun_buku_mulai)) {
      errors.tahun_buku_mulai = 'Tahun buku mulai tidak valid'
    }

    if (!isValidYear(body.tahun_buku_akhir)) {
      errors.tahun_buku_akhir = 'Tahun buku akhir tidak valid'
    }

    if (
      isValidYear(body.tahun_buku_mulai) &&
      isValidYear(body.tahun_buku_akhir) &&
      Number(body.tahun_buku_akhir) < Number(body.tahun_buku_mulai)
    ) {
      errors.tahun_buku_akhir = 'Tahun buku akhir tidak boleh sebelum tahun mulai'
    }

    // Optional fields — validate format if present
    if (!isValidNPWP(body.npwp)) {
      errors.npwp = 'NPWP harus 15 digit angka'
    }

    if (!isValidDate(body.tanggal_berdiri)) {
      errors.tanggal_berdiri = 'Format tanggal tidak valid (YYYY-MM-DD)'
    }

    // Text field length limits
    const textFields = ['alamat', 'desa', 'kecamatan', 'kabupaten', 'provinsi', 'no_akta']
    for (const field of textFields) {
      if (body[field] && String(body[field]).length > 500) {
        errors[field] = `${field} maksimal 500 karakter`
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 422 })
    }

    // Sanitize all text inputs before passing to DB
    const clean = {
      nama_koperasi:    sanitize(body.nama_koperasi),
      alamat:           sanitize(body.alamat)           || null,
      desa:             sanitize(body.desa)             || null,
      kecamatan:        sanitize(body.kecamatan)        || null,
      kabupaten:        sanitize(body.kabupaten)        || null,
      provinsi:         sanitize(body.provinsi)         || null,
      no_akta:          sanitize(body.no_akta)          || null,
      npwp:             body.npwp ? String(body.npwp).replace(/\D/g, '') || null : null,
      tanggal_berdiri:  body.tanggal_berdiri            || null,
      tahun_buku_mulai: Number(body.tahun_buku_mulai),
      tahun_buku_akhir: Number(body.tahun_buku_akhir),
    }

    // Auth check — only logged-in users can create koperasi
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    // Check user doesn't already have a koperasi
    const { data: existing } = await (supabase as any)
      .from('users')
      .select('koperasi_id')
      .eq('id', user.id)
      .single()

    if (existing?.koperasi_id) {
      return NextResponse.json(
        { success: false, error: 'Akun sudah terhubung ke koperasi' },
        { status: 409 }
      )
    }

    // Insert koperasi
    const { data: koperasi, error: koperasiError } = await (supabase as any)
      .from('koperasi')
      .insert(clean)
      .select()
      .single()

    if (koperasiError) {
      console.error('[api/setup] koperasi insert error:', koperasiError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan data koperasi' },
        { status: 500 }
      )
    }

    // Link user to koperasi
    const { error: userError } = await (supabase as any)
      .from('users')
      .update({ koperasi_id: koperasi.id })
      .eq('id', user.id)

    if (userError) {
      console.error('[api/setup] user update error:', userError)
      // Rollback koperasi insert
      await (supabase as any).from('koperasi').delete().eq('id', koperasi.id)
      return NextResponse.json(
        { success: false, error: 'Gagal mengaitkan akun dengan koperasi' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, koperasiId: koperasi.id })

  } catch (err) {
    console.error('[api/setup] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
