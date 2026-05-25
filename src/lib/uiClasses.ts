export const selectClass =
  'h-9 rounded-lg border border-border-subtle bg-elevated px-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20'

export const filterChipClass = (active: boolean) =>
  active
    ? 'rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white'
    : 'rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary'
