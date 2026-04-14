"use client"

import { useMemo, useState } from "react"
import { format, subDays, endOfDay } from "date-fns"
import toast from "react-hot-toast"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { useMood } from "@/hooks/useMood"
import type { Mood } from "@prisma/client"

const MOODS = [
  { value: 5, label: "Great", emoji: "😄" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 2, label: "Low", emoji: "😔" },
  { value: 1, label: "Bad", emoji: "😞" },
] as const

export function MoodClient() {
  const from = subDays(new Date(), 35).toISOString()
  const to = new Date().toISOString()
  const { moods, loading, reload } = useMood(from, to)

  const [note, setNote] = useState("")
  const [selected, setSelected] = useState<(typeof MOODS)[number] | null>(null)

  const todayKey = format(new Date(), "yyyy-MM-dd")
  const todayMood = useMemo(() => {
    return moods.find((m) => format(new Date(m.date), "yyyy-MM-dd") === todayKey) ?? null
  }, [moods, todayKey])

  const chartData = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const m of moods) {
      byDay.set(format(new Date(m.date), "yyyy-MM-dd"), m.value)
    }
    const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i))
    let rolling: number[] = []
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd")
      const v = byDay.get(key)
      rolling.push(v ?? NaN)
      if (rolling.length > 7) rolling = rolling.slice(-7)
      const nums = rolling.filter((x) => !Number.isNaN(x))
      const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : NaN
      return {
        day: format(d, "MMM d"),
        mood: v ?? null,
        avg: Number.isNaN(avg) ? null : Number(avg.toFixed(2)),
      }
    })
  }, [moods])

  async function save() {
    if (!selected) return toast.error("Pick a mood")
    const r = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value: selected.value,
        label: selected.label,
        note: note || undefined,
      }),
    })
    if (!r.ok) return toast.error("Could not save mood")
    toast.success("Mood saved")
    setNote("")
    await reload()
  }

  return (
    <PageWrapper title="Mood" subtitle="One log per day — tune into patterns over time." accent="#f472b6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 text-sm text-zinc-400">How are you feeling today?</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelected(m)}
                className={`rounded-2xl border px-3 py-4 text-center transition ${
                  selected?.value === m.value || todayMood?.value === m.value
                    ? "border-pink-400/60 bg-pink-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-3xl">{m.emoji}</div>
                <div className="mt-2 text-xs text-zinc-300">
                  {m.label} ({m.value})
                </div>
              </button>
            ))}
          </div>
          {todayMood ? (
            <p className="mt-3 text-xs text-zinc-500">
              Logged today as <span className="text-zinc-200">{todayMood.label}</span>. Tap another
              mood and save to edit.
            </p>
          ) : null}
          <textarea
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            rows={3}
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button className="mt-3" type="button" onClick={save}>
            Save mood
          </Button>
        </Card>
        <Card>
          <div className="text-sm font-medium text-zinc-300">Today</div>
          {loading ? (
            <Skeleton className="mt-3 h-24" />
          ) : todayMood ? (
            <div className="mt-4 text-center">
              <div className="text-5xl">
                {MOODS.find((m) => m.value === todayMood.value)?.emoji ?? "🙂"}
              </div>
              <div className="mt-2 text-white">{todayMood.label}</div>
              {todayMood.note ? <p className="mt-2 text-xs text-zinc-400">{todayMood.note}</p> : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No mood logged yet today.</p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-medium text-zinc-300">Last 30 days + 7d average</div>
          <div className="h-72">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="day" stroke="#71717a" interval={4} />
                  <YAxis domain={[1, 5]} stroke="#71717a" width={24} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Line type="monotone" dataKey="mood" stroke="#f472b6" connectNulls dot />
                  <Line type="monotone" dataKey="avg" stroke="#06b6d4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-3 text-sm font-medium text-zinc-300">Monthly calendar</div>
          <MoodCalendar moods={moods} loading={loading} />
        </Card>
      </div>
    </PageWrapper>
  )
}

function MoodCalendar({ moods, loading }: { moods: Mood[]; loading: boolean }) {
  const map = useMemo(() => {
    const m = new Map<string, number>()
    for (const x of moods) {
      m.set(format(new Date(x.date), "yyyy-MM-dd"), x.value)
    }
    return m
  }, [moods])

  const days = Array.from({ length: 35 }, (_, i) => subDays(endOfDay(new Date()), 34 - i))

  if (loading) return <Skeleton className="h-64" />

  return (
    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
      {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
        <div key={d} className="py-1">
          {d}
        </div>
      ))}
      {days.map((d) => {
        const key = format(d, "yyyy-MM-dd")
        const v = map.get(key)
        const bg =
          v === undefined
            ? "bg-white/5"
            : v >= 4
              ? "bg-pink-500/40"
              : v === 3
                ? "bg-amber-400/30"
                : "bg-indigo-500/30"
        return (
          <div key={key} className={`aspect-square rounded-lg ${bg} flex items-center justify-center text-xs text-white`}>
            {format(d, "d")}
          </div>
        )
      })}
    </div>
  )
}
