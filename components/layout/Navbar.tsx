"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/Button"

export function Navbar({ title }: { title?: string }) {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0f1117]/80 px-4 py-3 backdrop-blur lg:hidden">
      <Link href="/dashboard" className="font-display text-lg text-white">
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
