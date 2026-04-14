import { NextResponse } from "next/server"
import { endOfWeek, format, startOfWeek } from "date-fns"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"
import { computeWellnessScore } from "@/lib/analytics"

export async function GET() {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const [moods, waterLogs, workoutLogs, tasks, journals] = await Promise.all([
    prisma.mood.findMany({
      where: { userId: auth.userId, date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.waterLog.findMany({
      where: { userId: auth.userId, loggedAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.workoutLog.findMany({
      where: { userId: auth.userId, completedAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.task.findMany({
      where: {
        userId: auth.userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.journal.findMany({
      where: { userId: auth.userId, createdAt: { gte: weekStart, lte: weekEnd } },
    }),
  ])

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { waterGoal: true },
  })
  const waterGoalOz = user?.waterGoal ?? 64

  const moodByDay = new Map<string, number>()
  for (const m of moods) {
    moodByDay.set(format(m.date, "yyyy-MM-dd"), m.value)
  }

  const waterOzByDay = new Map<string, number>()
  for (const w of waterLogs) {
    const key = format(w.loggedAt, "yyyy-MM-dd")
    waterOzByDay.set(key, (waterOzByDay.get(key) ?? 0) + w.amount)
  }

  const workoutDays = new Set(
    workoutLogs.map((l) => format(l.completedAt, "yyyy-MM-dd")),
  )

  const journalDays = new Set(
    journals.map((j) => format(j.createdAt, "yyyy-MM-dd")),
  )

  const breakdown = computeWellnessScore({
    weekStart,
    weekEnd,
    moodByDay,
    waterOzByDay,
    waterGoalOz,
    workoutDays,
    tasksCreated: tasks.map((t) => ({ createdAt: t.createdAt, status: t.status })),
    journalDays,
  })

  const saved = await prisma.weeklyScore.upsert({
    where: {
      userId_weekOf: { userId: auth.userId, weekOf: weekStart },
    },
    create: {
      userId: auth.userId,
      weekOf: weekStart,
      score: breakdown.score,
      moodScore: breakdown.moodScore,
      waterScore: breakdown.waterScore,
      exerciseScore: breakdown.exerciseScore,
      taskScore: breakdown.taskScore,
      journalScore: breakdown.journalScore,
    },
    update: {
      score: breakdown.score,
      moodScore: breakdown.moodScore,
      waterScore: breakdown.waterScore,
      exerciseScore: breakdown.exerciseScore,
      taskScore: breakdown.taskScore,
      journalScore: breakdown.journalScore,
    },
  })

  return NextResponse.json(saved)
}
