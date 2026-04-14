"use client"

import { useMemo, useState } from "react"
import { format, isWithinInterval } from "date-fns"
import toast from "react-hot-toast"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Journal } from "@prisma/client"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { useJournal } from "@/hooks/useJournal"

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.string().optional(),
})

export function JournalClient() {
  const { entries, loading, reload } = useJournal()
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", tags: "" },
  })

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const q = search.toLowerCase()
      const text = `${e.title} ${e.body} ${e.tags.join(" ")}`.toLowerCase()
      if (q && !text.includes(q)) return false
      if (from && to) {
        const d = new Date(e.createdAt)
        if (!isWithinInterval(d, { start: new Date(from), end: new Date(to) })) return false
      }
      return true
    })
  }, [entries, search, from, to])

  async function onCreate(values: z.infer<typeof schema>) {
    const r = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: values.title, body: values.body, tags }),
    })
    if (!r.ok) return toast.error("Could not save entry")
    toast.success("Journal saved")
    form.reset()
    setTags([])
    await reload()
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this entry?")) return
    const r = await fetch(`/api/journal/${id}`, { method: "DELETE" })
    if (!r.ok) return toast.error("Delete failed")
    toast.success("Deleted")
    await reload()
  }

  async function onUpdate(entry: Journal, patch: Partial<Pick<Journal, "title" | "body" | "tags">>) {
    const r = await fetch(`/api/journal/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!r.ok) return toast.error("Update failed")
    toast.success("Updated")
    await reload()
  }

  return (
    <PageWrapper title="Journal" subtitle="Reflect, tag, and revisit your thoughts." accent="#818cf8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">New entry</h2>
          <form className="space-y-3" onSubmit={form.handleSubmit(onCreate)}>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Title"
              {...form.register("title")}
            />
            <textarea
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              rows={6}
              placeholder="Write freely..."
              {...form.register("body")}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Tag + Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="ghost" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-100"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                >
                  {t} ×
                </button>
              ))}
            </div>
            <Button type="submit" className="w-full">
              Save entry
            </Button>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white sm:col-span-1"
                placeholder="Search title, body, tags"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <input
                type="date"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                type="date"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </Card>

          {loading ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="space-y-3">
              {filtered.map((e) => (
                <JournalEntryCard
                  key={e.id}
                  entry={e}
                  expanded={expanded === e.id}
                  onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
                  onDelete={() => onDelete(e.id)}
                  onSave={(patch) => onUpdate(e, patch)}
                />
              ))}
              {!filtered.length ? (
                <p className="text-sm text-zinc-500">No entries match your filters.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

function JournalEntryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
  onSave,
}: {
  entry: Journal
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onSave: (patch: Partial<Pick<Journal, "title" | "body" | "tags">>) => void
}) {
  const [title, setTitle] = useState(entry.title)
  const [body, setBody] = useState(entry.body)

  return (
    <Card className="cursor-pointer" onClick={onToggle}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-500">{format(new Date(entry.createdAt), "PPp")}</div>
          <div className="mt-1 font-medium text-white">{entry.title}</div>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{entry.body.slice(0, 100)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-200">
                {t}
              </span>
            ))}
          </div>
        </div>
        <Button
          type="button"
          variant="danger"
          className="!px-2 !py-1 text-xs"
          onClick={(ev) => {
            ev.stopPropagation()
            onDelete()
          }}
        >
          Delete
        </Button>
      </div>
      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4" onClick={(e) => e.stopPropagation()}>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button type="button" onClick={() => onSave({ title, body, tags: entry.tags })}>
            Save changes
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
