import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-8 rounded-xl border border-danger/20 bg-card p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-danger" aria-hidden />
          <h2 className="mt-4 font-display text-lg font-bold text-text-primary">Something went wrong</h2>
          <p className="mt-2 text-sm text-text-secondary">
            {import.meta.env.DEV ? this.state.error.message : 'An unexpected error occurred. Please try again.'}
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            Retry
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
