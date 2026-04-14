"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "./nav"

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0c0e14]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[52px] flex-col items-center rounded-xl px-2 py-1 text-[10px] ${
                active ? "text-white" : "text-zinc-500"
              }`}
            >
              <span className="text-lg" style={{ color: active ? item.color : "#71717a" }}>
                {item.icon}
              </span>
              <span className="mt-0.5 truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
