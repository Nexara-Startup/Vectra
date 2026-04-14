"use client"

import { useEffect, useMemo, useState } from "react"
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd"
import { isBefore, startOfDay } from "date-fns"
import toast from "react-hot-toast"
import type { Task } from "@prisma/client"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { useTasks } from "@/hooks/useTasks"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  category: z.enum(["work", "personal", "health", "other"]),
})

const COLS = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
] as const

export function TasksClient() {
  const { tasks, loading, reload } = useTasks()
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [filterPri, setFilterPri] = useState<string>("all")
  const [filterCat, setFilterCat] = useState<string>("all")
  const [panel, setPanel] = useState<Task | null>(null)

  const form = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "medium" as const,
      category: "personal" as const,
    },
  })

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterPri !== "all" && t.priority !== filterPri) return false
      if (filterCat !== "all" && t.category !== filterCat) return false
      return true
    })
  }, [tasks, filterPri, filterCat])

  async function onDragEnd(res: DropResult) {
    if (!res.destination) return
    const id = res.draggableId
    const status = res.destination.droppableId as Task["status"]
    const r = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!r.ok) return toast.error("Could not update task")
    toast.success("Updated")
    await reload()
  }

  async function createTask(v: z.infer<typeof createSchema>) {
    const r = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...v,
        dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : null,
      }),
    })
    if (!r.ok) return toast.error("Could not create task")
    toast.success("Task created")
    form.reset()
    await reload()
  }

  async function addToCalendar(task: Task) {
    if (!task.dueDate) return toast.error("Set a due date first")
    const start = new Date(task.dueDate)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(10, 0, 0, 0)
    const r = await fetch("/api/google-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: task.title,
        description: task.description ?? "",
        start: start.toISOString(),
        end: end.toISOString(),
      }),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      return toast.error(j.error ?? "Calendar error")
    }
    const ev = await r.json()
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calEventId: ev.id ?? null }),
    })
    toast.success("Added to Google Calendar")
    await reload()
  }

  return (
    <PageWrapper title="Tasks" subtitle="Kanban, filters, and calendar handoff." accent="#facc15">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Add task</h2>
          <form className="space-y-3" onSubmit={form.handleSubmit(createTask)}>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Title"
              {...form.register("title")}
            />
            <textarea
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              rows={3}
              placeholder="Description"
              {...form.register("description")}
            />
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              {...form.register("dueDate")}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
                {...form.register("priority")}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
                {...form.register("category")}
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant={view === "kanban" ? "primary" : "ghost"} onClick={() => setView("kanban")}>
                Kanban
              </Button>
              <Button type="button" variant={view === "list" ? "primary" : "ghost"} onClick={() => setView("list")}>
                List
              </Button>
              <select
                className="ml-auto rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-white"
                value={filterPri}
                onChange={(e) => setFilterPri(e.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                className="rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-white"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="all">All categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </Card>

          {loading ? (
            <Card>Loading…</Card>
          ) : view === "kanban" ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid gap-3 md:grid-cols-3">
                {COLS.map((col) => (
                  <Droppable droppableId={col.id} key={col.id}>
                    {(prov, snap) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.droppableProps}
                        className={`rounded-2xl border border-white/10 bg-white/5 p-2 min-h-[240px] ${
                          snap.isDraggingOver ? "ring-1 ring-cyan-400/40" : ""
                        }`}
                      >
                        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                          {col.title}
                        </div>
                        {filtered
                          .filter((t) => t.status === col.id)
                          .map((t, idx) => (
                            <Draggable key={t.id} draggableId={t.id} index={idx}>
                              {(p) => (
                                <div
                                  ref={p.innerRef}
                                  {...p.draggableProps}
                                  {...p.dragHandleProps}
                                  className={`mb-2 rounded-xl border bg-black/30 p-2 text-sm ${
                                    t.dueDate &&
                                    t.status !== "done" &&
                                    isBefore(new Date(t.dueDate), startOfDay(new Date()))
                                      ? "border-red-400/60"
                                      : "border-white/10"
                                  }`}
                                >
                                  <div className="font-medium text-white">{t.title}</div>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    <Badge tone="accent">{t.priority}</Badge>
                                    <Badge>{t.category}</Badge>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Button type="button" variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setPanel(t)}>
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="!px-2 !py-1 text-xs"
                                      onClick={() => addToCalendar(t)}
                                    >
                                      Add to Calendar
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="danger"
                                      className="!px-2 !py-1 text-xs"
                                      onClick={async () => {
                                        if (!confirm("Delete task?")) return
                                        const r = await fetch(`/api/tasks/${t.id}`, { method: "DELETE" })
                                        if (!r.ok) return toast.error("Delete failed")
                                        toast.success("Deleted")
                                        await reload()
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {prov.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-zinc-500">
                    <tr>
                      <th className="p-2">Title</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Priority</th>
                      <th className="p-2">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id} className="border-t border-white/10">
                        <td className="p-2 text-white">{t.title}</td>
                        <td className="p-2">{t.status}</td>
                        <td className="p-2">{t.priority}</td>
                        <td className="p-2 text-zinc-400">
                          {t.dueDate ? new Date(t.dueDate).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      <TaskPanel task={panel} onClose={() => setPanel(null)} onSaved={reload} />
    </PageWrapper>
  )
}

function TaskPanel({
  task,
  onClose,
  onSaved,
}: {
  task: Task | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("medium")
  const [category, setCategory] = useState<Task["category"]>("personal")
  const [due, setDue] = useState("")

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? "")
    setPriority(task.priority as Task["priority"])
    setCategory(task.category as Task["category"])
    setDue(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "")
  }, [task])

  async function save() {
    if (!task) return
    const r = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priority,
        category,
        dueDate: due ? new Date(due).toISOString() : null,
      }),
    })
    if (!r.ok) return toast.error("Save failed")
    toast.success("Saved")
    await onSaved()
    onClose()
  }

  return (
    <Modal open={!!task} title="Edit task" onClose={onClose}>
      {task ? (
        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as Task["category"])}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="other">Other</option>
            </select>
          </div>
          <input
            type="datetime-local"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <Button type="button" className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      ) : null}
    </Modal>
  )
}
