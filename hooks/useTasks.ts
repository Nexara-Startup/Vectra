"use client"

import { useCallback } from "react"
import type { Task } from "@prisma/client"
import { useAppDataStore } from "@/store/appDataStore"

export function useTasks() {
  const tasks = useAppDataStore((s) => s.data?.tasks ?? [])
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )
  const patchTasks = useAppDataStore((s) => s.patchTasks)

  const reload = useCallback(() => useAppDataStore.getState().refresh(), [])

  const setTasks = useCallback(
    (next: Task[]) => {
      patchTasks(next)
    },
    [patchTasks],
  )

  return { tasks, loading: pending, reload, setTasks }
}
