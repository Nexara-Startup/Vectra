export function PageWrapper({
  title,
  subtitle,
  accent = "#06b6d4",
  children,
}: {
  title: string
  subtitle?: string
  accent?: string
  children: React.ReactNode
}) {
  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-6 sm:px-6 sm:pb-10 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1 rounded-full" style={{ backgroundColor: accent }} />
          <div>
            <h1 className="font-display text-3xl tracking-tight text-white sm:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-zinc-400">{subtitle}</p> : null}
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
