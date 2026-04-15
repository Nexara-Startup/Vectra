import type { SVGProps } from "react"

/** Vectra app mark: rounded square, teal gradient, white V, amber apex. */
export function VectraMark(
  props: SVGProps<SVGSVGElement> & {
    /** Accessible name when the mark is used alone; omit when decorative next to text. */
    title?: string
  },
) {
  const { className, title, ...rest } = props
  const labeled = Boolean(title?.trim())
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={labeled ? undefined : true}
      role={labeled ? "img" : "presentation"}
      {...rest}
    >
      {labeled ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="vectra-teal-mark" x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="45%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#vectra-teal-mark)" />
      <path fill="#ffffff" d="M256 118 L388 394 L334 394 L256 218 L178 394 L124 394 Z" />
      <circle cx="256" cy="398" r="20" fill="#f59e0b" />
    </svg>
  )
}
