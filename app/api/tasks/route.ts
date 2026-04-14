import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  category: z.enum(["work", "personal", "health", "other"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().int().optional(),
})

export async function GET() {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const tasks = await prisma.task.findMany({
    where: { userId: auth.userId },
    orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const maxOrder = await prisma.task.aggregate({
    where: { userId: auth.userId },
    _max: { order: true },
  })
  const task = await prisma.task.create({
    data: {
      userId: auth.userId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: parsed.data.status ?? "todo",
      priority: parsed.data.priority ?? "medium",
      category: parsed.data.category ?? "personal",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      order: parsed.data.order ?? (maxOrder._max.order ?? 0) + 1,
    },
  })
  return NextResponse.json(task)
}
