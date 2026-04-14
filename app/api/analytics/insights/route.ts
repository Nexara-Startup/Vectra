import { NextResponse } from "next/server"
import { requireSessionUserId } from "@/lib/api-auth"
import { loadBootstrapSnapshot } from "@/lib/load-bootstrap-snapshot"

/** Same data as bootstrap `insights` slice (recomputed from DB for direct API callers). */
export async function GET() {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response

  try {
    const snap = await loadBootstrapSnapshot(auth.userId)
    return NextResponse.json(snap.analytics)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Insights failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
