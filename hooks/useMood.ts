"use client"

import { useCallback, useMemo } from "react"
import { filterMoodsByRange } from "@/lib/client-data-filters"
import { useAppDataStore } from "@/store/appDataStore"

export function useMood(from?: string, to?: string) {
  const moodsAll = useAppDataStore((s) => s.data?.moods ?? [])
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )
  const moods = useMemo(() => filterMoodsByRange(moodsAll, from, to), [moodsAll, from, to])

  const reload = useCallback(() => useAppDataStore.getState().refresh(), [])

  return { moods, loading: pending, reload }
}
