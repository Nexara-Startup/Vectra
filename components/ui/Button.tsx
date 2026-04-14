import type { ButtonHTMLAttributes } from "react"

const variants = {
  primary:
    "bg-cyan-500/90 text-[#0f1117] hover:bg-cyan-400 focus-visible:ring-cyan-300/60",
  ghost: "bg-white/5 text-zinc-100 hover:bg-white/10 border border-white/10",
  danger: "bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/30",
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
