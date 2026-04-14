"use client"

import { useCallback, useMemo } from "react"
import { filterWaterLogsByRange } from "@/lib/client-data-filters"
import { useAppDataStore } from "@/store/appDataStore"

export function useWater(from?: string, to?: string) {
  const data = useAppDataStore((s) => s.data)
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )

  const logs = useMemo(
    () => filterWaterLogsByRange(data?.waterLogs ?? [], from, to),
    [data?.waterLogs, from, to],
  )

  const waterGoal = data?.user?.waterGoal ?? 64

  const setWaterGoal = useCallback((value: number) => {
    const d = useAppDataStore.getState().data
    if (!d?.user) return
    useAppDataStore.setState({ data: { ...d, user: { ...d.user, waterGoal: value } } })
  }, [])

  const reload = useCallback(() => useAppDataStore.getState().refresh(), [])

  return { logs, waterGoal, setWaterGoal, loading: pending, reload }
}
