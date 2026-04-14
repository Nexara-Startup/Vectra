"use client"

export function TooltipWrapper({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-20 hidden -translate-x-1/2 rounded-lg border border-white/10 bg-[#0f1117] px-2 py-1 text-[10px] text-zinc-200 shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  )
}
