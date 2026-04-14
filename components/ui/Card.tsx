import type { HTMLAttributes } from "react"

export function Card({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}
