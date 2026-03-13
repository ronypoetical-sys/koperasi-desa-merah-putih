'use client'

/**
 * useAuth — Custom hook to eliminate repeated auth boilerplate
 * Provides userId, koperasiId, role and loading state
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AuthState {
  userId: string
  koperasiId: string
  role: string
  loading: boolean
  error: string | null
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: '',
    koperasiId: '',
    role: 'admin',
    loading: true,
    error: null,
  })

  const init = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        window.location.href = '/auth/login'
        return
      }

      const { data: userData, error: userError } = await (supabase
        .from('users')
        .select('koperasi_id, role')
        .eq('id', user.id)
        .single() as any)

      if (userError || !userData?.koperasi_id) {
        window.location.href = '/setup'
        return
      }

      setState({
        userId: user.id,
        koperasiId: userData.koperasi_id as string,
        role: (userData.role as string) || 'admin',
        loading: false,
        error: null,
      })
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Gagal memuat sesi' }))
    }
  }, [])

  useEffect(() => { init() }, [init])

  return state
}
