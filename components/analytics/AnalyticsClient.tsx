"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDataStore } from "@/store/appDataStore"
import { format, subDays } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
} from "recharts"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"

type Insights = {
  moods: { date: string; value: number }[]
  waterLogs: { loggedAt: string; amount: number }[]
  foodLogs: { loggedAt: string; calories: number; protein: number }[]
  workoutLogs: { completedAt: string }[]
  tasks: { status: string; category: string; createdAt: string; updatedAt: string }[]
  journals: { createdAt: string; tags: string[] }[]
  weeklyScores: { weekOf: string; score: number }[]
  insights: { title: string; body: string }[]
  weeklyReportText: string
  goals: { waterGoal: number; calorieGoal: number; proteinGoal: number }
}

export function AnalyticsClient() {
  const insights = useAppDataStore((s) => s.data?.analytics ?? null) as Insights | null
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )
  const [score, setScore] = useState<{ score: number } | null>(null)
  const [scoreLoading, setScoreLoading] = useState(true)

  useEffect(() => {
    if (pending) return
    let cancelled = false
    async function loadScore() {
      setScoreLoading(true)
      const s = await fetch("/api/analytics/score")
      if (s.ok && !cancelled) setScore(await s.json())
      if (!cancelled) setScoreLoading(false)
    }
    void loadScore()
    return () => {
      cancelled = true
    }
  }, [pending])

  const loading = pending || scoreLoading

  const moodSeries = useMemo(() => {
    if (!insights) return []
    const map = new Map<string, number>()
    for (const m of insights.moods) {
      map.set(format(new Date(m.date), "yyyy-MM-dd"), m.value)
    }
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i)
      const key = format(d, "yyyy-MM-dd")
      const v = map.get(key)
      const slice = Array.from({ length: 7 }, (_, j) => {
        const dd = subDays(d, 6 - j)
        return map.get(format(dd, "yyyy-MM-dd"))
      }).filter((x): x is number => x !== undefined)
      const avg = slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null
      return { day: format(d, "MMM d"), mood: v ?? null, avg }
    })
  }, [insights])

  const waterSeries = useMemo(() => {
    if (!insights) return []
    const g = insights.goals.waterGoal
    return Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i)
      const key = format(d, "yyyy-MM-dd")
      const oz = insights.waterLogs
        .filter((w) => format(new Date(w.loggedAt), "yyyy-MM-dd") === key)
        .reduce((a, w) => a + w.amount, 0)
      const pct = Math.round((oz / Math.max(g, 1)) * 100)
      return {
        day: format(d, "EEE"),
        pct,
        fill: pct >= 100 ? "#4ade80" : pct >= 50 ? "#fb923c" : "#f87171",
      }
    })
  }, [insights])

  const exerciseWeekly = useMemo(() => {
    if (!insights) return []
    return Array.from({ length: 8 }, (_, i) => {
      const end = subDays(new Date(), i * 7)
      const start = subDays(end, 6)
      const count = insights.workoutLogs.filter(
        (l) => new Date(l.completedAt) >= start && new Date(l.completedAt) <= end,
      ).length
      return { label: format(start, "MMM d"), count }
    }).reverse()
  }, [insights])

  const donut = useMemo(() => {
    if (!insights) return []
    const total = insights.tasks.length || 1
    const done = insights.tasks.filter((t) => t.status === "done").length
    return [
      { name: "Done", value: done },
      { name: "Open", value: Math.max(0, total - done) },
    ]
  }, [insights])

  const journalWeekly = useMemo(() => {
    if (!insights) return []
    return Array.from({ length: 12 }, (_, i) => {
      const end = subDays(new Date(), i * 7)
      const start = subDays(end, 6)
      const count = insights.journals.filter(
        (j) => new Date(j.createdAt) >= start && new Date(j.createdAt) <= end,
      ).length
      return { label: format(start, "MMM d"), count }
    }).reverse()
  }, [insights])

  const tagCloud = useMemo(() => {
    if (!insights) return []
    const m = new Map<string, number>()
    for (const j of insights.journals) {
      for (const t of j.tags) m.set(t, (m.get(t) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [insights])

  const scatter = useMemo(() => {
    if (!insights) return { ex: [] as { x: number; y: number }[], hyd: [] as { x: number; y: number }[] }
    const moodByDay = new Map<string, number>()
    for (const m of insights.moods) {
      moodByDay.set(format(new Date(m.date), "yyyy-MM-dd"), m.value)
    }
    const exDays = new Set(
      insights.workoutLogs.map((l) => format(new Date(l.completedAt), "yyyy-MM-dd")),
    )
    const ex = [...moodByDay.entries()]
      .map(([day, y]) => ({ x: exDays.has(day) ? 1 : 0, y }))
      .slice(0, 60)

    const ozByDay = new Map<string, number>()
    for (const w of insights.waterLogs) {
      const k = format(new Date(w.loggedAt), "yyyy-MM-dd")
      ozByDay.set(k, (ozByDay.get(k) ?? 0) + w.amount)
    }
    const g = insights.goals.waterGoal
    const hyd = [...moodByDay.entries()].map(([day, y]) => ({
      x: Math.round(((ozByDay.get(day) ?? 0) / Math.max(g, 1)) * 100),
      y,
    }))
    return { ex, hyd }
  }, [insights])

  const scoreLine = useMemo(() => {
    if (!insights) return []
    return insights.weeklyScores.map((w) => ({
      week: format(new Date(w.weekOf), "MMM d"),
      score: Math.round(w.score),
    }))
  }, [insights])

  const best = scoreLine.reduce((m, p) => (p.score > m ? p.score : m), 0)

  const ringColor =
    (score?.score ?? 0) <= 40 ? "#f87171" : (score?.score ?? 0) <= 70 ? "#fb923c" : "#4ade80"

  return (
    <PageWrapper title="Analytics" subtitle="Cross-module trends and your wellness score." accent="#06b6d4">
      {loading || !insights ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Wellness score (week)</div>
            <div className="relative mt-4 h-40 w-40">
              <svg className="-rotate-90" width="160" height="160" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" stroke="#ffffff10" strokeWidth="10" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke={ringColor}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={(1 - (score?.score ?? 0) / 100) * 2 * Math.PI * 52}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-4xl font-semibold text-white">
                {Math.round(score?.score ?? 0)}
              </div>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <div className="text-sm font-medium text-zinc-300">Weekly report</div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{insights.weeklyReportText}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {insights.insights.map((x) => (
                <div key={x.title} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-300">
                  <div className="font-medium text-white">{x.title}</div>
                  <p className="mt-1 text-zinc-400">{x.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Mood trends</div>
          <div className="h-64">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="day" stroke="#71717a" interval={6} />
                  <YAxis domain={[1, 5]} stroke="#71717a" width={24} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }} />
                  <Line type="monotone" dataKey="mood" stroke="#f472b6" connectNulls dot />
                  <Line type="monotone" dataKey="avg" stroke="#06b6d4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Water consistency (% of goal)</div>
          <div className="h-64">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="day" stroke="#71717a" />
                  <YAxis stroke="#71717a" width={28} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }} />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {waterSeries.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Exercise volume (8 weeks)</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exerciseWeekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="label" stroke="#71717a" interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="#71717a" width={28} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }} />
                  <Bar dataKey="count" fill="#fb923c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Nutrition (30d calories)</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={Array.from({ length: 30 }, (_, i) => {
                    const d = subDays(new Date(), 29 - i)
                    const key = format(d, "yyyy-MM-dd")
                    const cals = insights!.foodLogs
                      .filter((f) => format(new Date(f.loggedAt), "yyyy-MM-dd") === key)
                      .reduce((a, f) => a + f.calories, 0)
                    return { day: format(d, "MMM d"), cals }
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="day" stroke="#71717a" interval={6} />
                  <YAxis stroke="#71717a" width={32} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }} />
                  <ReferenceLine y={insights!.goals.calorieGoal} stroke="#f59e0b" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="cals" stroke="#4ade80" fill="#4ade8022" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Task completion</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    <Cell fill="#4ade80" />
                    <Cell fill="#ffffff22" />
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Journal entries / week</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={journalWeekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="label" stroke="#71717a" interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="#71717a" width={28} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }} />
                  <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
            {tagCloud.map(([t, c]) => (
              <span key={t} className="rounded-full bg-white/10 px-2 py-0.5">
                {t} ({c})
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Exercise days vs mood</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" dataKey="x" name="workout" stroke="#71717a" domain={[0, 1]} />
                  <YAxis type="number" dataKey="y" name="mood" stroke="#71717a" domain={[1, 5]} />
                  <ZAxis range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={scatter.ex} fill="#06b6d4" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Hydration % vs mood</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" dataKey="x" name="water%" stroke="#71717a" />
                  <YAxis type="number" dataKey="y" name="mood" stroke="#71717a" domain={[1, 5]} />
                  <ZAxis range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={scatter.hyd} fill="#38bdf8" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="mb-2 text-sm text-zinc-400">Wellness score history</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreLine}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="week" stroke="#71717a" />
                  <YAxis domain={[0, 100]} stroke="#71717a" width={28} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }} />
                  <ReferenceLine y={best} stroke="#facc15" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
