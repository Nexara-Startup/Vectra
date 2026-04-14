import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSessionUserId } from "@/lib/api-auth"
import { createCalendarEvent, listCalendarEvents } from "@/lib/google-calendar"

const listQuery = z.object({
  from: z.string(),
  to: z.string(),
})

const createBody = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
})

export async function GET(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const { searchParams } = new URL(req.url)
  const parsed = listQuery.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "from and to ISO dates required" }, { status: 400 })
  }
  try {
    const events = await listCalendarEvents(
      auth.userId,
      new Date(parsed.data.from),
      new Date(parsed.data.to),
    )
    return NextResponse.json(events)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Calendar error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = createBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const event = await createCalendarEvent(auth.userId, {
      summary: parsed.data.summary,
      description: parsed.data.description,
      start: new Date(parsed.data.start),
      end: new Date(parsed.data.end),
    })
    return NextResponse.json(event)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Calendar error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
