import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userData } = await supabase.from('users').select('koperasi_id').eq('id', user.id).single() as any
  if (!userData?.koperasi_id) redirect('/setup')

  // Stats
  const { data: stats } = await supabase
    .from('v_dashboard_stats')
    .select('*')
    .eq('koperasi_id', userData.koperasi_id)
    .single()

  // Recent transactions
  const { data: recentTx } = await supabase
    .from('transactions')
    .select('*, unit_usaha(nama_unit), anggota(nama)')
    .eq('koperasi_id', userData.koperasi_id)
    .order('created_at', { ascending: false })
    .limit(8)

  // SHU data tahun ini
  const tahun = new Date().getFullYear()
  const { data: shuData } = await supabase
    .from('v_shu')
    .select('bulan, pendapatan, beban')
    .eq('koperasi_id', userData.koperasi_id)
    .eq('tahun', tahun)

  return (
    <DashboardClient
      stats={stats}
      recentTransactions={recentTx || []}
      shuRawData={shuData || []}
      tahun={tahun}
    />
  )
}
