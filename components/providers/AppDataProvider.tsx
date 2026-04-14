"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef } from "react"
import { useAppDataStore } from "@/store/appDataStore"

const PERIODIC_REFRESH_MS = 5 * 60 * 1000
const STALE_ON_FOCUS_MS = 2 * 60 * 1000

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const refresh = useAppDataStore((s) => s.refresh)
  const reset = useAppDataStore((s) => s.reset)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      reset()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    if (status !== "authenticated") return

    void refresh()

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      void useAppDataStore.getState().refresh()
    }, PERIODIC_REFRESH_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, refresh, reset])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return
      const t = useAppDataStore.getState().bootstrappedAt
      if (!t || Date.now() - t > STALE_ON_FOCUS_MS) {
        useAppDataStore.getState().queueRefresh()
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  return <>{children}</>
}
