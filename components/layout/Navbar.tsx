"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { VectraMark } from "@/components/icons/VectraMark"

export function Navbar({ title }: { title?: string }) {
  const pathname = usePathname()
  return (
    <header className="flex items-center justify-between px-4 py-3 lg:hidden">
      <Link
        href="/dashboard"
        aria-label="Vectra dashboard"
        className="flex items-center gap-2 font-display text-lg text-white"
      >
        <VectraMark className="h-8 w-8 shrink-0 rounded-md" />
        Vectra
      </Link>
      <div className="flex items-center gap-2">
        {title ? <span className="hidden text-xs text-zinc-400 sm:inline">{title}</span> : null}
        <span className="max-w-[40vw] truncate text-xs text-zinc-500">{pathname}</span>
        <Button type="button" variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => signOut()}>
          Out
        </Button>
      </div>
    </header>
  )
}
