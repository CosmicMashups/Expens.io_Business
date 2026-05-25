import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/Logo'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      toast.error('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) toast.error(error.message)
    else navigate('/dashboard')
  }

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Configure Supabase environment variables')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-base p-4">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(0,153,255,0.08),transparent_70%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-[400px] rounded-2xl border border-border-subtle bg-elevated p-10 shadow-elevated">
        <div className="mb-8 text-center">
          <Logo variant="icon" size="lg" className="mb-4 justify-center" />
          <h1 className="font-display text-2xl font-bold">
            <span className="text-accent">Expens.io</span>
            <span className="font-body text-base font-medium text-text-secondary"> Business</span>
          </h1>
          <p className="mt-2 text-sm text-text-secondary">Enterprise Financial Operations</p>
        </div>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Sign in'}
          </Button>
        </form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border-subtle" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-elevated px-2 text-text-tertiary">Or</span>
          </div>
        </div>
        <Button type="button" variant="ghost" className="w-full" onClick={handleGoogle}>
          Continue with Google
        </Button>
        <p className="mt-6 text-center font-mono text-xs text-text-tertiary">v0.0.0</p>
      </div>
    </div>
  )
}
