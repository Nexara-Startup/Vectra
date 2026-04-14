export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  )
}
