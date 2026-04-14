"use client"

import { useCallback, useState } from "react"

export function useGoogleCalendar() {
  const [loading, setLoading] = useState(false)

  const fetchRange = useCallback(async (from: Date, to: Date) => {
    setLoading(true)
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    })
    const r = await fetch(`/api/google-calendar?${params}`)
    setLoading(false)
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      throw new Error(j.error ?? "Failed to load calendar")
    }
    return r.json() as Promise<unknown[]>
  }, [])

  return { loading, fetchRange }
}
