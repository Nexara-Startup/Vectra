import { NextResponse } from "next/server"
import { requireSessionUserId } from "@/lib/api-auth"
import { loadBootstrapSnapshot } from "@/lib/load-bootstrap-snapshot"

export async function GET() {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response

  try {
    const snapshot = await loadBootstrapSnapshot(auth.userId)
    return NextResponse.json(snapshot)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bootstrap failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
