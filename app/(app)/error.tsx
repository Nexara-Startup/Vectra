"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"

export default function AppError({
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
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-2xl text-white">Something went wrong</h1>
      <p className="text-sm text-zinc-400">{error.message}</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
