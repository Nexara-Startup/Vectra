"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"

function playBeep() {
  const ctx = new AudioContext()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = "sine"
  o.frequency.value = 880
  o.connect(g)
  g.connect(ctx.destination)
  g.gain.value = 0.08
  o.start()
  setTimeout(() => {
    o.stop()
    void ctx.close()
  }, 220)
}

export function RestTimer() {
  const [seconds, setSeconds] = useState(60)
  const [left, setLeft] = useState(60)
  const [running, setRunning] = useState(false)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) return
    tick.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false)
          playBeep()
          return seconds
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (tick.current) clearInterval(tick.current)
    }
  }, [running, seconds])

  const pct = Math.round(((seconds - left) / seconds) * 100)
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-medium text-zinc-300">Rest timer</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[60, 90, 120].map((s) => (
          <Button
            key={s}
            type="button"
            variant="ghost"
            className="!px-3 !py-1 text-xs"
            onClick={() => {
              setSeconds(s)
              setLeft(s)
              setRunning(false)
            }}
          >
            {s}s
          </Button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <svg className="-rotate-90" width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="#ffffff10" strokeWidth="10" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={r}
            stroke="#fb923c"
            strokeWidth="10"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div>
          <div className="text-3xl font-semibold text-white">{left}s</div>
          <Button type="button" className="mt-2" onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Start"}
          </Button>
        </div>
      </div>
    </div>
  )
}
