import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)
  const signOut = useAuthStore((s) => s.signOut)
  return { session, profile, isLoading, signOut, user: session?.user ?? null }
}
