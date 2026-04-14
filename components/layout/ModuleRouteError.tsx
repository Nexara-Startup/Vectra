"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"

export default function ModuleRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h2 className="font-display text-xl text-white">This section hit a snag</h2>
      <p className="text-sm text-zinc-400">{error.message}</p>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </div>
  )
}
