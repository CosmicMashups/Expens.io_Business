import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Subscription } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface AuthState {
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

let authSubscription: Subscription | null = null

async function loadProfile(session: Session) {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  return data as UserProfile | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const profile = await loadProfile(session)
      set({ session, profile, isLoading: false, initialized: true })
    } else {
      set({ session: null, profile: null, isLoading: false, initialized: true })
    }

    if (!authSubscription) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const profile = await loadProfile(session)
          set({ session, profile })
        } else {
          set({ session: null, profile: null })
        }
      })
      authSubscription = subscription
    }
  },

  refreshProfile: async () => {
    const { session } = get()
    if (!session) return
    const profile = await loadProfile(session)
    if (profile) set({ profile })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },
}))
