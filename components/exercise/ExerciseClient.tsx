"use client"

import { useMemo, useState } from "react"
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd"
import { endOfWeek, format, startOfWeek, subDays, subWeeks } from "date-fns"
import toast from "react-hot-toast"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CALISTHENICS_LIBRARY } from "@/lib/constants"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { useExercise } from "@/hooks/useExercise"
import { RestTimer } from "@/components/exercise/RestTimer"

type Row = { id: string; name: string; sets: number; reps: string }

export function ExerciseClient() {
  const { workouts, logs, loading, reload } = useExercise()
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [name, setName] = useState("My routine")
  const [open, setOpen] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [pick, setPick] = useState("")

  const filtered = CALISTHENICS_LIBRARY.filter(
    (e) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.muscle.toLowerCase().includes(q.toLowerCase()),
  )

  const freq = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
      const end = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
      const label = format(start, "MMM d")
      const count = logs.filter((l) => l.completedAt >= start && l.completedAt <= end).length
      return { label, count }
    }).reverse()
  }, [logs])

  const heatmap = useMemo(() => {
    const set = new Set(logs.map((l) => format(l.completedAt, "yyyy-MM-dd")))
    const days = Array.from({ length: 90 }, (_, i) => subDays(new Date(), 89 - i))
    return days.map((d) => ({
      key: format(d, "yyyy-MM-dd"),
      on: set.has(format(d, "yyyy-MM-dd")),
    }))
  }, [logs])

  function onDragEnd(res: DropResult) {
    if (!res.destination) return
    const next = Array.from(rows)
    const [removed] = next.splice(res.source.index, 1)
    next.splice(res.destination.index, 0, removed)
    setRows(next)
  }

  async function saveWorkout() {
    if (!rows.length) return toast.error("Add exercises")
    const r = await fetch("/api/exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        exercises: rows.map((x, i) => ({ name: x.name, sets: x.sets, reps: x.reps, order: i })),
      }),
    })
    if (!r.ok) return toast.error("Save failed")
    toast.success("Routine saved")
    setRows([])
    await reload()
  }

  async function logWorkout(workoutId: string) {
    const r = await fetch("/api/exercise/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId, notes: notes || null }),
    })
    if (!r.ok) return toast.error("Log failed")
    toast.success("Workout logged")
    setNotes("")
    await reload()
  }

  return (
    <PageWrapper title="Exercise" subtitle="Build routines, log sessions, rest with intent." accent="#fb923c">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={open === "lib" ? "primary" : "ghost"} onClick={() => setOpen("lib")}>
              Library
            </Button>
            <Button type="button" variant={open === "build" ? "primary" : "ghost"} onClick={() => setOpen("build")}>
              Builder
            </Button>
            <Button type="button" variant={open === "log" ? "primary" : "ghost"} onClick={() => setOpen("log")}>
              Log
            </Button>
          </div>

          {open === "lib" || open === null ? (
            <div>
              <input
                className="mb-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Search exercises..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((ex) => (
                  <div key={ex.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white">{ex.name}</div>
                        <div className="text-xs text-zinc-500">{ex.muscle}</div>
                      </div>
                      <Badge tone={ex.difficulty === "beginner" ? "success" : "warning"}>
                        {ex.difficulty}
                      </Badge>
                    </div>
                    <details className="mt-2 text-sm text-zinc-400">
                      <summary className="cursor-pointer text-cyan-300">Instructions</summary>
                      <p className="mt-2 text-xs leading-relaxed">{ex.instructions}</p>
                    </details>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-3 w-full text-xs"
                      onClick={() =>
                        setRows((r) => [
                          ...r,
                          { id: crypto.randomUUID(), name: ex.name, sets: 3, reps: "8-12" },
                        ])
                      }
                    >
                      Add to builder
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {open === "build" ? (
            <div>
              <input
                className="mb-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Routine name"
              />
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="ex">
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.droppableProps} className="space-y-2">
                      {rows.map((row, idx) => (
                        <Draggable key={row.id} draggableId={row.id} index={idx}>
                          {(p) => (
                            <div
                              ref={p.innerRef}
                              {...p.draggableProps}
                              {...p.dragHandleProps}
                              className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2"
                            >
                              <span className="text-xs text-zinc-500">⋮⋮</span>
                              <span className="flex-1 text-sm text-white">{row.name}</span>
                              <input
                                className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                                type="number"
                                value={row.sets}
                                onChange={(e) =>
                                  setRows((rs) =>
                                    rs.map((x) =>
                                      x.id === row.id ? { ...x, sets: Number(e.target.value) } : x,
                                    ),
                                  )
                                }
                              />
                              <input
                                className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                                value={row.reps}
                                onChange={(e) =>
                                  setRows((rs) =>
                                    rs.map((x) =>
                                      x.id === row.id ? { ...x, reps: e.target.value } : x,
                                    ),
                                  )
                                }
                              />
                              <Button
                                type="button"
                                variant="danger"
                                className="!px-2 !py-1 text-xs"
                                onClick={() => setRows((rs) => rs.filter((x) => x.id !== row.id))}
                              >
                                ✕
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {prov.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <Button type="button" className="mt-3 w-full" onClick={saveWorkout}>
                Save routine
              </Button>
            </div>
          ) : null}

          {open === "log" ? (
            <div className="space-y-3">
              <select
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">Select routine</option>
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                rows={3}
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button type="button" className="w-full" onClick={() => pick && logWorkout(pick)}>
                Mark complete
              </Button>
            </div>
          ) : null}
        </Card>

        <RestTimer />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-medium text-zinc-300">8-week frequency</div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={freq}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="label" stroke="#71717a" interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="#71717a" width={28} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Bar dataKey="count" fill="#fb923c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-3 text-sm font-medium text-zinc-300">Last 90 days heatmap</div>
          {loading ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="flex max-w-full flex-wrap gap-1">
              {heatmap.map((d) => (
                <div
                  key={d.key}
                  title={d.key}
                  className={`h-3 w-3 rounded-sm ${d.on ? "bg-orange-400/80" : "bg-white/5"}`}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="mb-3 text-sm font-medium text-zinc-300">My routines</div>
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2">
              {workouts.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="text-white">{w.name}</span>
                  <Button
                    type="button"
                    variant="danger"
                    className="!px-2 !py-1 text-xs"
                    onClick={async () => {
                      if (!confirm("Delete routine?")) return
                      const r = await fetch(`/api/exercise/${w.id}`, { method: "DELETE" })
                      if (!r.ok) return toast.error("Delete failed")
                      toast.success("Deleted")
                      await reload()
                    }}
                  >
                    Delete
                  </Button>
                </li>
              ))}
              {!workouts.length ? <p className="text-sm text-zinc-500">No routines yet.</p> : null}
            </ul>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}
