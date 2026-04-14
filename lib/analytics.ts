import { eachDayOfInterval, format, subDays, startOfDay } from "date-fns"

export type WeekInputs = {
  weekStart: Date
  weekEnd: Date
  moodByDay: Map<string, number>
  waterOzByDay: Map<string, number>
  waterGoalOz: number
  workoutDays: Set<string>
  tasksCreated: { createdAt: Date; status: string }[]
  journalDays: Set<string>
}

export function computeWellnessScore(input: WeekInputs): {
  score: number
  moodScore: number
  waterScore: number
  exerciseScore: number
  taskScore: number
  journalScore: number
} {
  const days = eachDayOfInterval({ start: input.weekStart, end: input.weekEnd })

  const moodVals = days
    .map((d) => input.moodByDay.get(format(d, "yyyy-MM-dd")))
    .filter((v): v is number => v !== undefined)
  const moodAvg = moodVals.length ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length : 0

  let waterGoalDaysHit = 0
  for (const d of days) {
    const key = format(d, "yyyy-MM-dd")
    const oz = input.waterOzByDay.get(key) ?? 0
    if (oz >= input.waterGoalOz) waterGoalDaysHit += 1
  }

  const workoutsThisWeek = days.filter((d) =>
    input.workoutDays.has(format(d, "yyyy-MM-dd")),
  ).length

  const tasksWeek = input.tasksCreated.filter(
    (t) => t.createdAt >= input.weekStart && t.createdAt <= input.weekEnd,
  )
  const done = tasksWeek.filter((t) => t.status === "done").length
  const taskCompletionRate = tasksWeek.length ? done / tasksWeek.length : 0

  let journalDaysThisWeek = 0
  for (const d of days) {
    if (input.journalDays.has(format(d, "yyyy-MM-dd"))) journalDaysThisWeek += 1
  }

  const moodScore = (moodAvg / 5) * 25
  const waterScore = (waterGoalDaysHit / 7) * 20
  const exerciseScore = Math.min(workoutsThisWeek / 4, 1) * 25
  const taskScore = taskCompletionRate * 15
  const journalScore = (journalDaysThisWeek / 7) * 15

  const score = Math.round(
    Math.min(100, moodScore + waterScore + exerciseScore + taskScore + journalScore),
  )

  return {
    score,
    moodScore,
    waterScore,
    exerciseScore,
    taskScore,
    journalScore,
  }
}

/** Consecutive calendar days ending today that appear in `dates` (any time that day). */
export function dayStreakFromToday(dates: Date[]): number {
  const keys = new Set(dates.map((d) => format(startOfDay(d), "yyyy-MM-dd")))
  let streak = 0
  for (let i = 0; i < 730; i++) {
    const d = subDays(startOfDay(new Date()), i)
    if (keys.has(format(d, "yyyy-MM-dd"))) streak += 1
    else break
  }
  return streak
}

export type Insight = { title: string; body: string }

export function buildCorrelationInsights(
  moodByDay: Map<string, number>,
  workoutDays: Set<string>,
  waterPctByDay: Map<string, number>,
): Insight[] {
  const insights: Insight[] = []

  const pairsExercise: { x: number; y: number }[] = []
  const pairsWater: { x: number; y: number }[] = []

  for (const [day, mood] of moodByDay) {
    const exercised = workoutDays.has(day) ? 1 : 0
    pairsExercise.push({ x: exercised, y: mood })
    const w = waterPctByDay.get(day)
    if (w !== undefined) pairsWater.push({ x: w, y: mood })
  }

  if (pairsExercise.length >= 5) {
    const withE = pairsExercise.filter((p) => p.x === 1)
    const without = pairsExercise.filter((p) => p.x === 0)
    if (withE.length && without.length) {
      const avgE = withE.reduce((a, p) => a + p.y, 0) / withE.length
      const avgN = without.reduce((a, p) => a + p.y, 0) / without.length
      const delta = avgE - avgN
      if (delta > 0.15) {
        insights.push({
          title: "Exercise and mood",
          body: `You're in a better mood on days you exercise — about ${delta.toFixed(1)} points higher on average.`,
        })
      }
    }
  }

  if (pairsWater.length >= 7) {
    const sorted = [...pairsWater].sort((a, b) => a.x - b.x)
    const hi = sorted.slice(Math.floor(sorted.length * 0.6))
    const lo = sorted.slice(0, Math.ceil(sorted.length * 0.4))
    if (hi.length && lo.length) {
      const avgHi = hi.reduce((a, p) => a + p.y, 0) / hi.length
      const avgLo = lo.reduce((a, p) => a + p.y, 0) / lo.length
      if (avgHi - avgLo > 0.2) {
        insights.push({
          title: "Hydration and mood",
          body: "Higher water intake days line up with stronger mood scores. Keep the bottle nearby.",
        })
      }
    }
  }

  if (!insights.length) {
    insights.push({
      title: "Keep logging",
      body: "More data unlocks sharper insights. Try logging mood, water, and workouts on the same days.",
    })
  }

  return insights.slice(0, 3)
}

export function weeklyReportSummary(parts: {
  workouts: number
  waterHit: number
  waterTotal: number
  journalEntries: number
}): string {
  return `This week you logged ${parts.workouts} workouts, hit your water goal ${parts.waterHit}/${parts.waterTotal} days, and journaled ${parts.journalEntries} times. Great work!`
}
