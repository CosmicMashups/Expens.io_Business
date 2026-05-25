import type { UseQueryResult } from '@tanstack/react-query'

/** True while the query has no settled data yet (initial load or hard reset). */
export function isQueryLoading<T>(query: Pick<UseQueryResult<T>, 'isPending' | 'isFetching'>) {
  return query.isPending && query.isFetching
}
