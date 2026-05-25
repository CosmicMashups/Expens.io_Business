import type { QueryClient } from '@tanstack/react-query'

/** Restart pending queries that have observers but never began fetching (common after fast route changes). */
export function resumeStuckQueries(queryClient: QueryClient) {
  for (const query of queryClient.getQueryCache().findAll()) {
    if (query.getObserversCount() === 0) continue
    const { status, fetchStatus } = query.state
    if (status === 'pending' && fetchStatus === 'idle') {
      void query.fetch()
    }
  }
}
