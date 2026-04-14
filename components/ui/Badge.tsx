export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "success" | "warning" | "danger" | "accent"
}) {
  const map = {
    neutral: "bg-white/10 text-zinc-200 border-white/10",
    success: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    warning: "bg-amber-500/15 text-amber-100 border-amber-400/20",
    danger: "bg-red-500/15 text-red-100 border-red-400/20",
    accent: "bg-cyan-500/15 text-cyan-100 border-cyan-400/20",
  } as const
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  )
}
