"use client"

import { useEffect } from "react"

/**
 * Unregisters service workers and clears Cache Storage in development.
 * A leftover PWA service worker from a production build often intercepts
 * `/_next/static/*` and causes ChunkLoadError / timeouts for layout chunks.
 */
export function DevSwCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (typeof window === "undefined") return

    void (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((r) => r.unregister()))
        }
        if ("caches" in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  return null
}
