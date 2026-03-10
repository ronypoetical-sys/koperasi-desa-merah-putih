import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*, koperasi(*)')
    .eq('id', user.id)
    .single() as any

  if (!userData?.koperasi_id) redirect('/setup')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={userData.role || 'admin'} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={userData} koperasi={userData.koperasi as any} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 page-enter">
          {children}
        </main>
        <footer className="border-t border-gray-100 bg-white px-6 py-2 text-center text-xs text-gray-400 no-print">
          Dikembangkan oleh <span className="font-medium text-gray-500">Imam Sahroni Darmawan</span>
        </footer>
      </div>
    </div>
  )
}
