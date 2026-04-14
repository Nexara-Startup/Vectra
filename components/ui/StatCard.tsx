import { Card } from "./Card"

export function StatCard({
  label,
  value,
  hint,
  accent = "#06b6d4",
}: {
  label: string
  value: React.ReactNode
  hint?: string
  accent?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />
      <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-2 font-display text-2xl text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </Card>
  )
}
