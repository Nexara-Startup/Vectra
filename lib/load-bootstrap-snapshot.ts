import { startOfWeek, subDays } from "date-fns"
import prisma from "@/lib/prisma"
import { computeInsightsBundle } from "@/lib/insights-bundle"
import type { BootstrapSnapshot } from "@/types/bootstrap-snapshot"

/** One-shot load for `/api/bootstrap` — wide date ranges so client can filter locally. */
export async function loadBootstrapSnapshot(userId: string): Promise<BootstrapSnapshot> {
  const now = new Date()
  const from30 = subDays(now, 30)
  const from90 = subDays(now, 90)
  const from12w = subDays(now, 12 * 7)
  const from120d = subDays(now, 120)
  const from60d = subDays(now, 60)
  const weekOf = startOfWeek(now, { weekStartsOn: 1 })

  const [
    user,
    journals,
    moods,
    waterLogs,
    foodLogs,
    tasks,
    workouts,
    workoutLogs,
    mealPlans,
    weeklyScores,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        waterGoal: true,
        calorieGoal: true,
        proteinGoal: true,
      },
    }),
    prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.mood.findMany({
      where: { userId, date: { gte: from120d } },
      orderBy: { date: "asc" },
    }),
    prisma.waterLog.findMany({
      where: { userId, loggedAt: { gte: from60d } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.foodLog.findMany({
      where: { userId, loggedAt: { gte: from60d } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    }),
    prisma.workout.findMany({
      where: { userId },
      include: { exercises: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: from120d } },
      orderBy: { completedAt: "desc" },
      take: 200,
      include: { workout: true },
    }),
    prisma.mealPlan.findMany({
      where: { userId, weekOf },
      orderBy: { weekday: "asc" },
    }),
    prisma.weeklyScore.findMany({
      where: { userId },
      orderBy: { weekOf: "asc" },
      take: 24,
    }),
  ])

  const waterGoal = user?.waterGoal ?? 64
  const calorieGoal = user?.calorieGoal ?? 2000
  const proteinGoal = user?.proteinGoal ?? 150

  const moodsForInsights = moods.filter((m) => m.date >= from30)
  const waterForInsights = waterLogs.filter((w) => w.loggedAt >= subDays(now, 14))
  const foodForInsights = foodLogs.filter((f) => f.loggedAt >= from30)
  const workoutLogsForInsights = workoutLogs.filter((l) => l.completedAt >= from90)
  const tasksForInsights = tasks.filter((t) => t.createdAt >= from12w)
  const journalsForInsights = journals.filter((j) => j.createdAt >= from12w)

  const analytics = computeInsightsBundle({
    moods: moodsForInsights,
    waterLogs: waterForInsights,
    foodLogs: foodForInsights,
    workoutLogs: workoutLogsForInsights,
    tasks: tasksForInsights,
    journals: journalsForInsights,
    weeklyScores,
    waterGoal,
    calorieGoal,
    proteinGoal,
  })

  return {
    user,
    journals,
    moods,
    waterLogs,
    foodLogs,
    tasks,
    workouts,
    workoutLogs,
    mealPlans,
    analytics,
  }
}
