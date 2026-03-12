/**
 * Fungsi Query Laporan Keuangan Koperasi
 * Neraca, SHU, Arus Kas, Buku Besar
 *
 * PERF-004 FIX: Fungsi menerima supabase client sebagai parameter.
 * Bisa dipanggil dari Server Component maupun Client Component.
 *
 * Server Component: import { createClient } from '@/lib/supabase/server'; const sb = await createClient()
 * Client Component: import { createClient } from '@/lib/supabase/client'; const sb = createClient()
 * Lalu: getNeraca(sb, koperasiId)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

export async function getNeraca(supabase: SupabaseClient, koperasi_id: string) {
  const { data, error } = await supabase
    .from('v_neraca').select('*').eq('koperasi_id', koperasi_id).order('kode_akun')
  if (error) throw error
  const aset      = data?.filter((a: any) => a.kategori === 'aset') || []
  const kewajiban = data?.filter((a: any) => a.kategori === 'kewajiban') || []
  const modal     = data?.filter((a: any) => a.kategori === 'modal') || []
  return {
    aset, kewajiban, modal,
    totalAset:      aset.reduce((s: number, a: any) => s + (a.saldo || 0), 0),
    totalKewajiban: kewajiban.reduce((s: number, a: any) => s + (a.saldo || 0), 0),
    totalModal:     modal.reduce((s: number, a: any) => s + (a.saldo || 0), 0),
  }
}

export async function getSHU(supabase: SupabaseClient, koperasi_id: string, tahun: number) {
  const { data, error } = await supabase
    .from('v_shu').select('*').eq('koperasi_id', koperasi_id).eq('tahun', tahun).order('nama_unit')
  if (error) throw error
  const pendapatanTotal = data?.reduce((s: number, r: any) => s + (r.pendapatan || 0), 0) || 0
  const bebanTotal      = data?.reduce((s: number, r: any) => s + (r.beban     || 0), 0) || 0
  return { data: data || [], pendapatanTotal, bebanTotal, shu: pendapatanTotal - bebanTotal }
}

export async function getBukuBesar(supabase: SupabaseClient, koperasi_id: string, account_id?: string) {
  let query = supabase.from('v_buku_besar').select('*').eq('koperasi_id', koperasi_id).order('tanggal')
  if (account_id) query = query.eq('account_id', account_id)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getDashboardStats(supabase: SupabaseClient, koperasi_id: string) {
  const { data, error } = await supabase
    .from('v_dashboard_stats').select('*').eq('koperasi_id', koperasi_id).single()
  if (error) throw error
  return data
}

export async function getRecentTransactions(supabase: SupabaseClient, koperasi_id: string, limit = 10) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, unit_usaha(nama_unit), anggota(nama), users(name)')
    .eq('koperasi_id', koperasi_id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getSHUBulanan(supabase: SupabaseClient, koperasi_id: string, tahun: number) {
  const { data, error } = await supabase
    .from('v_shu').select('bulan, pendapatan, beban').eq('koperasi_id', koperasi_id).eq('tahun', tahun)
  if (error) throw error
  const bulanMap: Record<number, { pendapatan: number; beban: number }> = {}
  data?.forEach((row: any) => {
    if (!bulanMap[row.bulan]) bulanMap[row.bulan] = { pendapatan: 0, beban: 0 }
    bulanMap[row.bulan].pendapatan += row.pendapatan || 0
    bulanMap[row.bulan].beban     += row.beban      || 0
  })
  return ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((nama, i) => ({
    bulan: nama,
    pendapatan: bulanMap[i+1]?.pendapatan || 0,
    beban:      bulanMap[i+1]?.beban      || 0,
    shu:       (bulanMap[i+1]?.pendapatan || 0) - (bulanMap[i+1]?.beban || 0),
  }))
}
