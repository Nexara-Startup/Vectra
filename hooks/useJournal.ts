"use client"

import { useCallback, useMemo } from "react"
import { useAppDataStore } from "@/store/appDataStore"

export function useJournal() {
  const entries = useAppDataStore((s) => s.data?.journals ?? [])
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries],
  )

  const reload = useCallback(() => useAppDataStore.getState().refresh(), [])

  return { entries: sorted, loading: pending, reload }
}
