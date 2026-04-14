"use client"

import { useMemo, useState } from "react"
import { format, subDays, startOfDay } from "date-fns"
import toast from "react-hot-toast"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { useWater } from "@/hooks/useWater"

export function WaterClient() {
  const from = subDays(new Date(), 14).toISOString()
  const to = new Date().toISOString()
  const { logs, waterGoal, loading, reload } = useWater(from, to)
  const [custom, setCustom] = useState("")

  const todayOz = useMemo(() => {
    const key = format(new Date(), "yyyy-MM-dd")
    return logs
      .filter((l) => format(new Date(l.loggedAt), "yyyy-MM-dd") === key)
      .reduce((a, l) => a + l.amount, 0)
  }, [logs])

  const pct = Math.min(100, Math.round((todayOz / Math.max(waterGoal, 1)) * 100))

  const chart = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => subDays(startOfDay(new Date()), 13 - i))
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd")
      const oz = logs
        .filter((l) => format(new Date(l.loggedAt), "yyyy-MM-dd") === key)
        .reduce((a, l) => a + l.amount, 0)
      const p = Math.round((oz / Math.max(waterGoal, 1)) * 100)
      return {
        label: format(d, "EEE"),
        pct: p,
        fill: p >= 100 ? "#4ade80" : p >= 50 ? "#fb923c" : "#f87171",
      }
    })
  }, [logs, waterGoal])

  const metDays = chart.filter((c) => c.pct >= 100).length

  async function add(amount: number) {
    const r = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
    if (!r.ok) return toast.error("Could not log water")
    toast.success(`+${amount} oz`)
    await reload()
  }

  async function updateGoal(g: number) {
    const r = await fetch("/api/water", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waterGoal: g }),
    })
    if (!r.ok) return toast.error("Could not update goal")
    toast.success("Goal updated")
    await reload()
  }

  return (
    <PageWrapper title="Water" subtitle="Stay consistent — small sips add up." accent="#38bdf8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center lg:col-span-1">
          {loading ? (
            <Skeleton className="h-48 w-48 rounded-full" />
          ) : (
            <ProgressRing pct={pct} label={`${todayOz} / ${waterGoal} oz`} />
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[8, 16, 24].map((n) => (
              <Button key={n} type="button" variant="ghost" onClick={() => add(n)}>
                +{n} oz
              </Button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="w-28 rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
              type="number"
              placeholder="Custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => {
                const n = Number(custom)
                if (!n) return toast.error("Enter oz")
                void add(n)
                setCustom("")
              }}
            >
              Add
            </Button>
          </div>
          <div className="mt-6 w-full">
            <label className="text-xs text-zinc-500">Daily goal (oz)</label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                defaultValue={waterGoal}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                onBlur={(e) => updateGoal(Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="mb-3 text-sm font-medium text-zinc-300">Today&apos;s log</div>
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <ul className="space-y-2">
                {logs
                  .filter((l) => format(new Date(l.loggedAt), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"))
                  .map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    >
                      <span>
                        +{l.amount} oz · {format(new Date(l.loggedAt), "p")}
                      </span>
                      <Button
                        type="button"
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={async () => {
                          const r = await fetch(`/api/water/${l.id}`, { method: "DELETE" })
                          if (!r.ok) return toast.error("Delete failed")
                          toast.success("Removed")
                          await reload()
                        }}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                {!logs.filter(
                  (l) => format(new Date(l.loggedAt), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
                ).length ? (
                  <p className="text-sm text-zinc-500">No logs yet today.</p>
                ) : null}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-300">14-day consistency</div>
              <div className="text-xs text-zinc-500">{metDays}/14 days goal met</div>
            </div>
            <div className="h-64">
              {loading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="label" stroke="#71717a" />
                    <YAxis domain={[0, 140]} stroke="#71717a" width={28} />
                    <Tooltip
                      contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }}
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                    <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                      {chart.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div className="relative h-48 w-48">
      <svg className="-rotate-90" width="192" height="192" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} stroke="#ffffff10" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="#38bdf8"
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-semibold text-white">{pct}%</div>
        <div className="mt-1 text-xs text-zinc-400">{label}</div>
      </div>
    </div>
  )
}
