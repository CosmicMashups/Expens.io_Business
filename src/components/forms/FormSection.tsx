export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`border-b border-border-subtle pb-6 last:border-0 ${className ?? ''}`}>
      <h3 className="mb-1 font-mono text-xs uppercase tracking-widest text-text-secondary">{title}</h3>
      {description && <p className="mb-4 text-xs text-text-tertiary">{description}</p>}
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}
