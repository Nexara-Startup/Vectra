import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  category: z.enum(["work", "personal", "health", "other"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().int().optional(),
  calEventId: z.string().optional().nullable(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const existing = await prisma.task.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      dueDate:
        parsed.data.dueDate === undefined
          ? undefined
          : parsed.data.dueDate
            ? new Date(parsed.data.dueDate)
            : null,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const existing = await prisma.task.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.task.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
