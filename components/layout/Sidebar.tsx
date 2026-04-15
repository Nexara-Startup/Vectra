"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { NAV_ITEMS } from "./nav"
import { useUiStore } from "@/store/uiStore"
import { Button } from "@/components/ui/Button"
import { VectraMark } from "@/components/icons/VectraMark"

export function Sidebar() {
  const pathname = usePathname()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-white/10 bg-[#0c0e14]/90 px-3 py-6 backdrop-blur-xl lg:flex ${collapsed ? "w-[72px]" : "w-60"}`}
    >
      <div className="mb-8 flex items-center justify-between px-1">
        <Link
          href="/dashboard"
          aria-label="Vectra dashboard"
          className="flex min-w-0 items-center gap-2 font-display text-lg tracking-tight text-white"
        >
          <VectraMark className="h-9 w-9 shrink-0 rounded-lg" />
          {collapsed ? <span className="sr-only">Vectra</span> : <span>Vectra</span>}
        </Link>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              }`}
            >
              <span className="text-base" style={{ color: item.color }}>
                {item.icon}
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto space-y-2 px-1">
        <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </aside>
  )
}
