import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface AuthState {
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      set({ session, profile: data as UserProfile, isLoading: false })
    } else {
      set({ session: null, profile: null, isLoading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ session, profile: data as UserProfile })
      } else {
        set({ session: null, profile: null })
      }
    })
  },

  refreshProfile: async () => {
    const { session } = get()
    if (!session) return
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (data) set({ profile: data as UserProfile })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },
}))
