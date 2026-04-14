"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { DevSwCleanup } from "@/components/DevSwCleanup"
import { AppDataProvider } from "@/components/providers/AppDataProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DevSwCleanup />
      <AppDataProvider>{children}</AppDataProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "bg-[#151923] text-sm text-zinc-100 border border-white/10",
          duration: 3200,
        }}
      />
    </SessionProvider>
  )
}
