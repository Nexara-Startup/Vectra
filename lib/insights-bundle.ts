import { format, subDays } from "date-fns"
import type { FoodLog, Journal, Mood, Task, WaterLog, WeeklyScore, WorkoutLog } from "@prisma/client"
import { buildCorrelationInsights, dayStreakFromToday, weeklyReportSummary } from "@/lib/analytics"

type WorkoutLogWithWorkout = WorkoutLog & { workout?: { id: string; name: string } }

export type InsightsBundle = {
  goals: { waterGoal: number; calorieGoal: number; proteinGoal: number }
  moods: Mood[]
  waterLogs: WaterLog[]
  foodLogs: FoodLog[]
  workoutLogs: WorkoutLogWithWorkout[]
  tasks: Task[]
  journals: Journal[]
  weeklyScores: WeeklyScore[]
  insights: ReturnType<typeof buildCorrelationInsights>
  streaks: { journal: number; exercise: number }
  weeklyReportText: string
}

export function computeInsightsBundle(params: {
  moods: Mood[]
  waterLogs: WaterLog[]
  foodLogs: FoodLog[]
  workoutLogs: WorkoutLogWithWorkout[]
  tasks: Task[]
  journals: Journal[]
  weeklyScores: WeeklyScore[]
  waterGoal: number
  calorieGoal: number
  proteinGoal: number
}): InsightsBundle {
  const now = new Date()
  const { moods, waterLogs, foodLogs, workoutLogs, tasks, journals, weeklyScores } = params
  const waterGoal = params.waterGoal
  const calorieGoal = params.calorieGoal
  const proteinGoal = params.proteinGoal

  const moodByDay = new Map<string, number>()
  for (const m of moods) {
    moodByDay.set(format(m.date, "yyyy-MM-dd"), m.value)
  }

  const waterPctByDay = new Map<string, number>()
  const waterOzByDay = new Map<string, number>()
  for (const w of waterLogs) {
    const key = format(w.loggedAt, "yyyy-MM-dd")
    waterOzByDay.set(key, (waterOzByDay.get(key) ?? 0) + w.amount)
  }
  for (const [k, oz] of waterOzByDay) {
    waterPctByDay.set(k, (oz / waterGoal) * 100)
  }

  const workoutDays = new Set(
    workoutLogs.map((l) => format(l.completedAt, "yyyy-MM-dd")),
  )

  const insights = buildCorrelationInsights(moodByDay, workoutDays, waterPctByDay)

  const journalStreak = dayStreakFromToday(journals.map((j) => j.createdAt))
  const exerciseStreak = dayStreakFromToday(workoutLogs.map((l) => l.completedAt))

  const weekWaterKeys = Array.from({ length: 7 }, (_, i) =>
    format(subDays(now, 6 - i), "yyyy-MM-dd"),
  )
  let waterHit = 0
  for (const k of weekWaterKeys) {
    if ((waterOzByDay.get(k) ?? 0) >= waterGoal) waterHit += 1
  }

  const report = weeklyReportSummary({
    workouts: workoutLogs.filter((l) => l.completedAt >= subDays(now, 7)).length,
    waterHit,
    waterTotal: 7,
    journalEntries: journals.filter((j) => j.createdAt >= subDays(now, 7)).length,
  })

  return {
    goals: { waterGoal, calorieGoal, proteinGoal },
    moods,
    waterLogs,
    foodLogs,
    workoutLogs,
    tasks,
    journals,
    weeklyScores,
    insights,
    streaks: { journal: journalStreak, exercise: exerciseStreak },
    weeklyReportText: report,
  }
}
