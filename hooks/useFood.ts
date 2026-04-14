"use client"

import { useCallback, useMemo } from "react"
import { filterFoodLogsByRange } from "@/lib/client-data-filters"
import { useAppDataStore } from "@/store/appDataStore"

export function useFood(from?: string, to?: string) {
  const data = useAppDataStore((s) => s.data)
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )

  const logs = useMemo(
    () => filterFoodLogsByRange(data?.foodLogs ?? [], from, to),
    [data?.foodLogs, from, to],
  )

  const calorieGoal = data?.user?.calorieGoal ?? 2000
  const proteinGoal = data?.user?.proteinGoal ?? 150

  const setCalorieGoal = useCallback((value: number) => {
    const d = useAppDataStore.getState().data
    if (!d?.user) return
    useAppDataStore.setState({ data: { ...d, user: { ...d.user, calorieGoal: value } } })
  }, [])

  const setProteinGoal = useCallback((value: number) => {
    const d = useAppDataStore.getState().data
    if (!d?.user) return
    useAppDataStore.setState({ data: { ...d, user: { ...d.user, proteinGoal: value } } })
  }, [])

  const reload = useCallback(() => useAppDataStore.getState().refresh(), [])

  return { logs, calorieGoal, proteinGoal, setCalorieGoal, setProteinGoal, loading: pending, reload }
}
