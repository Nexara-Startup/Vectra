"use client"

import { create } from "zustand"
import type { BootstrapSnapshot } from "@/types/bootstrap-snapshot"
import type { Task } from "@prisma/client"

export type AppDataStatus = "idle" | "loading" | "ready" | "error"

let debounceTimer: ReturnType<typeof setTimeout> | null = null

type AppDataState = {
  status: AppDataStatus
  isRefreshing: boolean
  error: string | null
  data: BootstrapSnapshot | null
  bootstrappedAt: number | null

  refresh: () => Promise<void>
  /** Merges multiple writes into one `/api/bootstrap` refetch */
  queueRefresh: () => void
  reset: () => void
  patchTasks: (tasks: Task[]) => void
}

export const useAppDataStore = create<AppDataState>((set, get) => ({
  status: "idle",
  isRefreshing: false,
  error: null,
  data: null,
  bootstrappedAt: null,

  reset: () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    set({
      status: "idle",
      isRefreshing: false,
      error: null,
      data: null,
      bootstrappedAt: null,
    })
  },

  patchTasks: (tasks) => {
    const d = get().data
    if (!d) return
    set({ data: { ...d, tasks } })
  },

  refresh: async () => {
    const hadData = !!get().data
    if (hadData) {
      set({ isRefreshing: true, error: null })
    } else {
      set({ status: "loading", error: null })
    }
    try {
      const r = await fetch("/api/bootstrap", { cache: "no-store" })
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? `HTTP ${r.status}`)
      }
      const data = (await r.json()) as BootstrapSnapshot
      set({
        data,
        status: "ready",
        isRefreshing: false,
        error: null,
        bootstrappedAt: Date.now(),
      })
    } catch (e) {
      set({
        status: hadData ? "ready" : "error",
        isRefreshing: false,
        error: e instanceof Error ? e.message : "Failed to load data",
      })
    }
  },

  queueRefresh: () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void get().refresh()
    }, 450)
  },
}))
