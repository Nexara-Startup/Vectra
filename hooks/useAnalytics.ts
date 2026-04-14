"use client"

import { useCallback } from "react"
import { useAppDataStore } from "@/store/appDataStore"

export function useAnalyticsInsights() {
  const data = useAppDataStore((s) => s.data?.analytics ?? null)
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )

  const reload = useCallback(() => useAppDataStore.getState().refresh(), [])

  return { data, loading: pending, reload }
}
