"use client"

import { useMemo, useState } from "react"
import { format, startOfWeek, subDays } from "date-fns"
import toast from "react-hot-toast"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { useFood } from "@/hooks/useFood"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
const logSchema = z.object({
  mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
  name: z.string().min(1),
  calories: z.coerce.number().int().nonnegative(),
  protein: z.coerce.number().nonnegative(),
  carbs: z.coerce.number().nonnegative(),
  fat: z.coerce.number().nonnegative(),
})

type Meal = { name: string; ingredients: string[] }

export function FoodClient() {
  const from = subDays(new Date(), 30).toISOString()
  const to = new Date().toISOString()
  const { logs, calorieGoal, proteinGoal, loading, reload } = useFood(from, to)
  const [tab, setTab] = useState<"log" | "prep">("log")

  const form = useForm({
    resolver: zodResolver(logSchema),
    defaultValues: {
      mealType: "Lunch" as const,
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  })

  const today = format(new Date(), "yyyy-MM-dd")
  const todayLogs = logs.filter((l) => format(new Date(l.loggedAt), "yyyy-MM-dd") === today)
  const todayCals = todayLogs.reduce((a, l) => a + l.calories, 0)
  const todayP = todayLogs.reduce((a, l) => a + l.protein, 0)
  const todayC = todayLogs.reduce((a, l) => a + l.carbs, 0)
  const todayF = todayLogs.reduce((a, l) => a + l.fat, 0)

  const chart = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i))
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd")
      const cals = logs
        .filter((l) => format(new Date(l.loggedAt), "yyyy-MM-dd") === key)
        .reduce((a, l) => a + l.calories, 0)
      return { day: format(d, "MMM d"), cals }
    })
  }, [logs])

  async function onSubmit(v: z.infer<typeof logSchema>) {
    const r = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    })
    if (!r.ok) return toast.error("Could not log food")
    toast.success("Logged")
    form.reset()
    await reload()
  }

  return (
    <PageWrapper title="Food" subtitle="Log meals, watch macros, plan the week." accent="#4ade80">
      <div className="mb-4 flex gap-2">
        <Button type="button" variant={tab === "log" ? "primary" : "ghost"} onClick={() => setTab("log")}>
          Log
        </Button>
        <Button type="button" variant={tab === "prep" ? "primary" : "ghost"} onClick={() => setTab("prep")}>
          Meal prep
        </Button>
      </div>

      {tab === "log" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">Log meal</h2>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
              <select
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                {...form.register("mealType")}
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
                {...form.register("name")}
              />
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white" type="number" placeholder="Calories" {...form.register("calories")} />
                <input className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white" type="number" placeholder="Protein" {...form.register("protein")} />
                <input className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white" type="number" placeholder="Carbs" {...form.register("carbs")} />
                <input className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white" type="number" placeholder="Fat" {...form.register("fat")} />
              </div>
              <Button type="submit" className="w-full">
                Save
              </Button>
            </form>
            <div className="mt-4 space-y-2 text-xs text-zinc-500">
              <div>Goals</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  defaultValue={calorieGoal}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white"
                  onBlur={async (e) => {
                    const r = await fetch("/api/food", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ calorieGoal: Number(e.target.value) }),
                    })
                    if (r.ok) {
                      toast.success("Calorie goal saved")
                      await reload()
                    }
                  }}
                />
                <input
                  type="number"
                  defaultValue={proteinGoal}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white"
                  onBlur={async (e) => {
                    const r = await fetch("/api/food", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ proteinGoal: Number(e.target.value) }),
                    })
                    if (r.ok) {
                      toast.success("Protein goal saved")
                      await reload()
                    }
                  }}
                />
              </div>
            </div>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card>
              <div className="mb-3 text-sm font-medium text-zinc-300">Today</div>
              {loading ? (
                <Skeleton className="h-24" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-zinc-500">Calories</div>
                    <div className="text-2xl text-white">
                      {todayCals} / {calorieGoal}
                    </div>
                    <MacroRing label="Protein" value={todayP} goal={proteinGoal} color="#4ade80" />
                    <MacroRing label="Carbs" value={todayC} goal={250} color="#38bdf8" />
                    <MacroRing label="Fat" value={todayF} goal={70} color="#facc15" />
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart}>
                        <defs>
                          <linearGradient id="cals" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="day" stroke="#71717a" interval={6} />
                        <YAxis stroke="#71717a" width={32} />
                        <Tooltip
                          contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }}
                          labelStyle={{ color: "#e5e7eb" }}
                        />
                        <ReferenceLine y={calorieGoal} stroke="#f59e0b" strokeDasharray="4 4" />
                        <Area type="monotone" dataKey="cals" stroke="#4ade80" fillOpacity={1} fill="url(#cals)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-3 text-sm font-medium text-zinc-300">Today&apos;s log</div>
              <ul className="space-y-2 text-sm">
                {todayLogs.map((l) => (
                  <li key={l.id} className="flex justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-white">
                      {l.mealType}: {l.name}
                    </span>
                    <span className="text-zinc-400">{l.calories} kcal</span>
                  </li>
                ))}
                {!todayLogs.length ? <p className="text-sm text-zinc-500">No meals logged today.</p> : null}
              </ul>
            </Card>
          </div>
        </div>
      ) : (
        <MealPrepPlanner />
      )}
    </PageWrapper>
  )
}

function MacroRing({
  label,
  value,
  goal,
  color,
}: {
  label: string
  value: number
  goal: number
  color: string
}) {
  const pct = Math.min(100, Math.round((value / Math.max(goal, 1)) * 100))
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>
          {Math.round(value)}g / {goal}g
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function MealPrepPlanner() {
  const weekOf = startOfWeek(new Date(), { weekStartsOn: 1 })
  const [grid, setGrid] = useState<Record<number, Record<string, Meal[]>>>(() => {
    const g: Record<number, Record<string, Meal[]>> = {}
    for (let d = 0; d < 7; d++) g[d] = { breakfast: [], lunch: [], dinner: [] }
    return g
  })
  const [listText, setListText] = useState("")

  async function saveWeek() {
    const days = Object.entries(grid).map(([weekday, meals]) => ({
      weekday: Number(weekday),
      meals,
    }))
    const r = await fetch("/api/food/mealplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekOf: weekOf.toISOString(), days }),
    })
    if (!r.ok) return toast.error("Save failed")
    toast.success("Meal plan saved")
  }

  function generateList() {
    const all: string[] = []
    for (const day of Object.values(grid)) {
      for (const slot of Object.values(day)) {
        for (const meal of slot) {
          all.push(...meal.ingredients)
        }
      }
    }
    const trimmed = all.map((i) => i.trim()).filter(Boolean)
    const counts = new Map<string, number>()
    for (const i of trimmed) counts.set(i, (counts.get(i) ?? 0) + 1)
    const lines = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k}${v > 1 ? ` ×${v}` : ""}`)
    setListText(lines.join("\n"))
    toast.success("Shopping list generated")
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-zinc-400">Week of {format(weekOf, "PPP")}</div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={generateList}>
              Generate shopping list
            </Button>
            <Button type="button" onClick={saveWeek}>
              Save week
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-7">
          {dayNames.map((dn, idx) => (
            <div key={dn} className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <div className="text-center text-xs font-medium text-zinc-300">{dn}</div>
              {(["breakfast", "lunch", "dinner"] as const).map((slot) => (
                <div key={slot} className="mt-2">
                  <div className="text-[10px] uppercase text-zinc-500">{slot}</div>
                  <MealSlotEditor
                    meals={grid[idx][slot]}
                    onChange={(next) =>
                      setGrid((g) => ({
                        ...g,
                        [idx]: { ...g[idx], [slot]: next },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="mb-2 text-sm font-medium text-zinc-300">Shopping list</div>
        <textarea
          className="h-40 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white"
          value={listText}
          onChange={(e) => setListText(e.target.value)}
          placeholder="Ingredients appear here — copy to Notes or your grocer app."
        />
      </Card>
    </div>
  )
}

function MealSlotEditor({ meals, onChange }: { meals: Meal[]; onChange: (m: Meal[]) => void }) {
  const [name, setName] = useState("")
  const [ing, setIng] = useState("")

  return (
    <div className="space-y-2">
      {meals.map((m, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-2 text-[11px] text-zinc-200">
          <div className="font-medium text-white">{m.name}</div>
          <div className="text-zinc-500">{m.ingredients.join(", ")}</div>
        </div>
      ))}
      <input
        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white"
        placeholder="Meal name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white"
        placeholder="Ingredients (comma separated)"
        value={ing}
        onChange={(e) => setIng(e.target.value)}
      />
      <Button
        type="button"
        variant="ghost"
        className="w-full !py-1 text-[11px]"
        onClick={() => {
          if (!name.trim()) return
          onChange([...meals, { name: name.trim(), ingredients: ing.split(",").map((x) => x.trim()).filter(Boolean) }])
          setName("")
          setIng("")
        }}
      >
        Add meal
      </Button>
    </div>
  )
}
