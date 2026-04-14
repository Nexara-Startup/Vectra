"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDataStore } from "@/store/appDataStore"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
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
import { StatCard } from "@/components/ui/StatCard"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Skeleton } from "@/components/ui/Skeleton"
import { quoteForDay } from "@/lib/constants"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

type Props = { defaultName: string | null }

const waterSchema = z.object({ amount: z.coerce.number().int().positive() })
const moodSchema = z.object({
  value: z.coerce.number().int().min(1).max(5),
  label: z.string().min(1),
  note: z.string().optional(),
})
const taskSchema = z.object({ title: z.string().min(1) })
const foodSchema = z.object({
  mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
  name: z.string().min(1),
  calories: z.coerce.number().int().nonnegative(),
  protein: z.coerce.number().nonnegative(),
  carbs: z.coerce.number().nonnegative(),
  fat: z.coerce.number().nonnegative(),
})

export function DashboardClient({ defaultName }: Props) {
  const firstName = defaultName?.split(" ")[0] ?? "there"
  const quote = useMemo(() => quoteForDay(), [])

  const data = useAppDataStore((s) => s.data)
  const pending = useAppDataStore(
    (s) => !s.data && (s.status === "loading" || s.status === "idle"),
  )
  const bootAt = useAppDataStore((s) => s.bootstrappedAt)

  const kpis = useMemo(() => {
    if (!data) {
      return {
        moods: [] as { date: string; value: number }[],
        waterOz: 0,
        waterGoal: 64,
        tasksDoneToday: 0,
        tasksTotalToday: 1,
        caloriesToday: 0,
        todayMood: null as { value: number; label: string } | null,
        streaks: { journal: 0, exercise: 0 },
      }
    }

    const today = new Date()
    const fromD = startOfDay(today)
    const toD = endOfDay(today)
    const from7 = subDays(startOfDay(today), 6)

    const moodList = data.moods.filter((m) => {
      const t = new Date(m.date)
      return t >= from7 && t <= toD
    })

    const moodChart = moodList.map((m) => ({
      date: format(new Date(m.date), "EEE"),
      value: m.value,
    }))

    const waterToday = data.waterLogs.filter((w) => {
      const t = new Date(w.loggedAt)
      return t >= fromD && t <= toD
    })
    const oz = waterToday.reduce((a, l) => a + l.amount, 0)
    const waterGoal = data.user?.waterGoal ?? 64

    const taskList = data.tasks
    const done = taskList.filter(
      (x) =>
        x.status === "done" &&
        new Date(x.updatedAt) >= fromD &&
        new Date(x.updatedAt) <= toD,
    ).length
    const touched = taskList.filter(
      (x) => new Date(x.updatedAt) >= fromD && new Date(x.updatedAt) <= toD,
    ).length

    const foodToday = data.foodLogs.filter((f) => {
      const t = new Date(f.loggedAt)
      return t >= fromD && t <= toD
    })
    const cals = foodToday.reduce((a, l) => a + l.calories, 0)

    const todayM = moodList.find(
      (m) => format(new Date(m.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
    )

    return {
      moods: moodChart,
      waterOz: oz,
      waterGoal,
      tasksDoneToday: done,
      tasksTotalToday: Math.max(touched, done, 1),
      caloriesToday: cals,
      todayMood: todayM ? { value: todayM.value, label: todayM.label } : null,
      streaks: data.analytics.streaks ?? { journal: 0, exercise: 0 },
    }
  }, [data])

  const { moods, waterOz, waterGoal, tasksDoneToday, tasksTotalToday, caloriesToday, todayMood, streaks } =
    kpis

  const [events, setEvents] = useState<
    { id?: string | null; summary?: string | null; start?: { dateTime?: string | null }; end?: { dateTime?: string | null }; colorId?: string | null }[]
  >([])
  const [quickOpen, setQuickOpen] = useState(false)
  const [tab, setTab] = useState<"water" | "mood" | "task" | "food">("water")

  useEffect(() => {
    if (!bootAt) return
    let cancelled = false
    async function loadCal() {
      const today = new Date()
      const from = startOfDay(today).toISOString()
      const to = endOfDay(today).toISOString()
      try {
        const calRes = await fetch(
          `/api/google-calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        ).catch(() => null)
        let ev: typeof events = []
        if (calRes?.ok) {
          ev = await calRes.json()
        }
        if (!cancelled) setEvents(Array.isArray(ev) ? ev : [])
      } catch {
        if (!cancelled) setEvents([])
      }
    }
    void loadCal()
    return () => {
      cancelled = true
    }
  }, [bootAt])

  const waterPct = Math.min(100, Math.round((waterOz / Math.max(waterGoal, 1)) * 100))

  const waterForm = useForm({ resolver: zodResolver(waterSchema), defaultValues: { amount: 8 } })
  const moodForm = useForm({
    resolver: zodResolver(moodSchema),
    defaultValues: { value: 4, label: "Good", note: "" },
  })
  const taskForm = useForm({ resolver: zodResolver(taskSchema), defaultValues: { title: "" } })
  const foodForm = useForm({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      mealType: "Lunch" as const,
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  })

  async function submitWater(v: z.infer<typeof waterSchema>) {
    const r = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    })
    if (!r.ok) return toast.error("Could not log water")
    toast.success("Water logged")
    setQuickOpen(false)
    useAppDataStore.getState().queueRefresh()
  }

  async function submitMood(v: z.infer<typeof moodSchema>) {
    const r = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    })
    if (!r.ok) return toast.error("Could not log mood")
    toast.success("Mood saved")
    setQuickOpen(false)
    useAppDataStore.getState().queueRefresh()
  }

  async function submitTask(v: z.infer<typeof taskSchema>) {
    const r = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    })
    if (!r.ok) return toast.error("Could not create task")
    toast.success("Task added")
    setQuickOpen(false)
    taskForm.reset()
    useAppDataStore.getState().queueRefresh()
  }

  async function submitFood(v: z.infer<typeof foodSchema>) {
    const r = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    })
    if (!r.ok) return toast.error("Could not log food")
    toast.success("Food logged")
    setQuickOpen(false)
    foodForm.reset()
    useAppDataStore.getState().queueRefresh()
  }

  return (
    <PageWrapper title="Dashboard" subtitle={format(new Date(), "EEEE, MMMM d")} accent="#06b6d4">
      <div className="mb-6">
        <p className="text-lg text-zinc-200">
          Welcome back, <span className="text-white">{firstName}</span>
        </p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">{quote}</p>
      </div>

      {pending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's mood"
            value={todayMood ? `${todayMood.label}` : "—"}
            hint={todayMood ? `Score ${todayMood.value}/5` : "Log your mood"}
            accent="#f472b6"
          />
          <StatCard
            label="Water progress"
            value={`${waterPct}%`}
            hint={`${waterOz} / ${waterGoal} oz`}
            accent="#38bdf8"
          />
          <StatCard
            label="Tasks done today"
            value={`${tasksDoneToday}`}
            hint={`Touches today: ${tasksTotalToday}`}
            accent="#facc15"
          />
          <StatCard
            label="Calories today"
            value={`${caloriesToday}`}
            hint="From food log"
            accent="#4ade80"
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-zinc-300">Today on your calendar</div>
          {pending ? (
            <Skeleton className="h-40" />
          ) : events.length ? (
            <ul className="space-y-2">
              {events.slice(0, 6).map((e) => (
                <li
                  key={e.id ?? e.summary ?? Math.random().toString()}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="text-white">{e.summary ?? "(No title)"}</span>
                  <span className="text-xs text-zinc-500">
                    {e.start?.dateTime
                      ? format(new Date(e.start.dateTime), "p")
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No events today or calendar not connected.</p>
          )}
        </Card>
        <Card>
          <div className="text-sm font-medium text-zinc-300">Streaks</div>
          <div className="mt-3 space-y-2 text-sm text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Journal</span>
              <span className="font-mono text-white">{streaks.journal}d</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Exercise</span>
              <span className="font-mono text-white">{streaks.exercise}d</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-medium text-zinc-300">Mood trend (7 days)</div>
          <div className="h-56">
            {pending ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#71717a" />
                  <YAxis domain={[1, 5]} stroke="#71717a" width={24} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#f472b6" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-3 text-sm font-medium text-zinc-300">Focus</div>
          <p className="text-sm text-zinc-400">
            Use Quick Add to capture water, mood, tasks, and food without leaving this page. Open
            Analytics for deeper trends.
          </p>
        </Card>
      </div>

      <button
        type="button"
        onClick={() => setQuickOpen(true)}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-2xl text-[#0f1117] shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 lg:bottom-8"
        aria-label="Quick add"
      >
        +
      </button>

      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="Quick add">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["water", "mood", "task", "food"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant={tab === t ? "primary" : "ghost"}
              className="!px-3 !py-1 text-xs capitalize"
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        {tab === "water" ? (
          <form className="space-y-3" onSubmit={waterForm.handleSubmit(submitWater)}>
            <label className="block text-xs text-zinc-400">Ounces</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              type="number"
              {...waterForm.register("amount")}
            />
            <div className="flex gap-2">
              {[8, 16, 24].map((n) => (
                <Button key={n} type="button" variant="ghost" onClick={() => waterForm.setValue("amount", n)}>
                  +{n} oz
                </Button>
              ))}
            </div>
            <Button type="submit" className="w-full">
              Log water
            </Button>
          </form>
        ) : null}
        {tab === "mood" ? (
          <form className="space-y-3" onSubmit={moodForm.handleSubmit(submitMood)}>
            <label className="block text-xs text-zinc-400">Mood (1–5)</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              {...moodForm.register("value", { valueAsNumber: true })}
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Label (e.g. Good)"
              {...moodForm.register("label")}
            />
            <textarea
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Optional note"
              rows={2}
              {...moodForm.register("note")}
            />
            <Button type="submit" className="w-full">
              Save mood
            </Button>
          </form>
        ) : null}
        {tab === "task" ? (
          <form className="space-y-3" onSubmit={taskForm.handleSubmit(submitTask)}>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Task title"
              {...taskForm.register("title")}
            />
            <Button type="submit" className="w-full">
              Add task
            </Button>
          </form>
        ) : null}
        {tab === "food" ? (
          <form className="space-y-3" onSubmit={foodForm.handleSubmit(submitFood)}>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              {...foodForm.register("mealType")}
            >
              {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Food name"
              {...foodForm.register("name")}
            />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" type="number" placeholder="Calories" {...foodForm.register("calories")} />
              <input className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" type="number" placeholder="Protein" {...foodForm.register("protein")} />
              <input className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" type="number" placeholder="Carbs" {...foodForm.register("carbs")} />
              <input className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" type="number" placeholder="Fat" {...foodForm.register("fat")} />
            </div>
            <Button type="submit" className="w-full">
              Log food
            </Button>
          </form>
        ) : null}
      </Modal>
    </PageWrapper>
  )
}
