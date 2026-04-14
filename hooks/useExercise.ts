"use client"

import { useCallback, useMemo } from "react"
import { useAppDataStore } from "@/store/appDataStore"
import type { WorkoutLogWithWorkout, WorkoutWithExercises } from "@/types/bootstrap-snapshot"

export function useExercise() {
  const data = useAppDataStore((s) => s.data)
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )

  const workouts = useMemo(
    () => (data?.workouts ?? []) as WorkoutWithExercises[],
    [data?.workouts],
  )
  const logs = useMemo(
    () => (data?.workoutLogs ?? []) as WorkoutLogWithWorkout[],
    [data?.workoutLogs],
  )

  const reload = useCallback(() => useAppDataStore.getState().refresh(), [])

  return { workouts, logs, loading: pending, reload }
}
