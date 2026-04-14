"use client"

import { useEffect, useMemo, useState } from "react"
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from "date-fns"
import toast from "react-hot-toast"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"

type GEvent = {
  id?: string | null
  summary?: string | null
  colorId?: string | null
  start?: { dateTime?: string | null; date?: string | null }
  end?: { dateTime?: string | null; date?: string | null }
}

const COLORS: Record<string, string> = {
  "1": "#a4bdfc",
  "2": "#7ae7bf",
  "3": "#dbadff",
  "4": "#ff887c",
  "5": "#fbd75b",
  "6": "#ffb878",
  "7": "#46d6db",
  "8": "#5484ed",
  "9": "#51b749",
  "10": "#dc2127",
}

export function CalendarClient() {
  const [cursor, setCursor] = useState(() => new Date())
  const [events, setEvents] = useState<GEvent[]>([])
  const [loading, setLoading] = useState(true)

  const range = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 })
    const end = endOfWeek(cursor, { weekStartsOn: 1 })
    return { start, end }
  }, [cursor])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        })
        const r = await fetch(`/api/google-calendar?${params}`)
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error ?? "Failed")
        }
        const data = await r.json()
        if (!cancelled) setEvents(data)
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Calendar error")
          setEvents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [range.start, range.end])

  const days = eachDayOfInterval({ start: range.start, end: range.end })

  function eventsForDay(d: Date) {
    return events.filter((e) => {
      const s = e.start?.dateTime ?? e.start?.date
      if (!s) return false
      const dt = new Date(s)
      return format(dt, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
    })
  }

  return (
    <PageWrapper title="Calendar" subtitle="Your Google Calendar week at a glance." accent="#a78bfa">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-400">
            {format(range.start, "MMM d")} – {format(range.end, "MMM d, yyyy")}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setCursor((c) => subWeeks(c, 1))}>
              ← Prev
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCursor((c) => addWeeks(c, 1))}>
              Next →
            </Button>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="grid gap-2 md:grid-cols-7">
            {days.map((d) => (
              <div key={d.toISOString()} className="rounded-2xl border border-white/10 bg-white/5 p-2">
                <div className="text-center text-xs text-zinc-500">{format(d, "EEE")}</div>
                <div className="text-center text-lg text-white">{format(d, "d")}</div>
                <div className="mt-2 space-y-2">
                  {eventsForDay(d).map((e) => {
                    const s = e.start?.dateTime ?? e.start?.date
                    const en = e.end?.dateTime ?? e.end?.date
                    const color = COLORS[e.colorId ?? ""] ?? "#06b6d4"
                    return (
                      <div
                        key={e.id ?? e.summary ?? Math.random().toString()}
                        className="rounded-lg border border-white/10 bg-black/30 p-2 text-[11px]"
                        style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                      >
                        <div className="font-medium text-white">{e.summary ?? "(No title)"}</div>
                        <div className="mt-1 text-[10px] text-zinc-500">
                          {s ? format(new Date(s), "p") : ""} – {en ? format(new Date(en), "p") : ""}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
