import { endOfDay, startOfDay } from "date-fns"
import type { FoodLog, Mood, WaterLog } from "@prisma/client"

function rangeBounds(from?: string, to?: string) {
  if (!from || !to) return null
  return { start: startOfDay(new Date(from)).getTime(), end: endOfDay(new Date(to)).getTime() }
}

export function filterMoodsByRange(moods: Mood[], from?: string, to?: string) {
  const b = rangeBounds(from, to)
  if (!b) return moods
  return moods.filter((m) => {
    const t = new Date(m.date).getTime()
    return t >= b.start && t <= b.end
  })
}

export function filterWaterLogsByRange(logs: WaterLog[], from?: string, to?: string) {
  const b = rangeBounds(from, to)
  if (!b) return logs
  return logs.filter((l) => {
    const t = new Date(l.loggedAt).getTime()
    return t >= b.start && t <= b.end
  })
}

export function filterFoodLogsByRange(logs: FoodLog[], from?: string, to?: string) {
  const b = rangeBounds(from, to)
  if (!b) return logs
  return logs.filter((l) => {
    const t = new Date(l.loggedAt).getTime()
    return t >= b.start && t <= b.end
  })
}
