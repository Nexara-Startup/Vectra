import { PrismaClient } from "@prisma/client"
import { subDays } from "date-fns"

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })
  if (!user) {
    console.log("No User row found. Sign in with Google once, then run: npm run db:seed")
    return
  }

  const today = new Date()

  await prisma.journal.createMany({
    data: [
      {
        userId: user.id,
        title: "First light",
        body: "Starting small with Vectra. Tracking mood, water, and training together.",
        tags: ["start", "gratitude"],
      },
      {
        userId: user.id,
        title: "Mid-week check-in",
        body: "Energy dipped Tuesday, bounced back after a walk and extra water.",
        tags: ["energy", "water"],
      },
    ],
  })

  for (let i = 0; i < 14; i++) {
    const d = subDays(today, i)
    await prisma.mood.create({
      data: {
        userId: user.id,
        value: 3 + (i % 3),
        label: ["Okay", "Good", "Great"][i % 3],
        note: i === 0 ? "Feeling steady" : null,
        date: d,
      },
    })
  }

  for (let i = 0; i < 10; i++) {
    await prisma.waterLog.create({
      data: {
        userId: user.id,
        amount: 8 + (i % 3) * 8,
        loggedAt: subDays(today, i % 5),
      },
    })
  }

  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      name: "Starter bodyweight",
      exercises: {
        create: [
          { name: "Push-Ups", sets: 3, reps: "10-12", order: 0 },
          { name: "Squats", sets: 3, reps: "12-15", order: 1 },
          { name: "Plank", sets: 3, reps: "45s", order: 2 },
        ],
      },
    },
    include: { exercises: true },
  })

  for (let i = 0; i < 6; i++) {
    await prisma.workoutLog.create({
      data: {
        userId: user.id,
        workoutId: workout.id,
        completedAt: subDays(today, i * 2),
        notes: i === 0 ? "Felt strong" : null,
      },
    })
  }

  await prisma.foodLog.createMany({
    data: [
      {
        userId: user.id,
        mealType: "Breakfast",
        name: "Oats + berries",
        calories: 420,
        protein: 18,
        carbs: 62,
        fat: 10,
        loggedAt: today,
      },
      {
        userId: user.id,
        mealType: "Lunch",
        name: "Chicken bowl",
        calories: 640,
        protein: 48,
        carbs: 55,
        fat: 18,
        loggedAt: today,
      },
    ],
  })

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: "Plan weekly review",
        description: "Sunday evening",
        status: "todo",
        priority: "high",
        category: "work",
        dueDate: subDays(today, -2),
        order: 1,
      },
      {
        userId: user.id,
        title: "Walk 20 minutes",
        status: "in_progress",
        priority: "medium",
        category: "health",
        dueDate: today,
        order: 2,
      },
      {
        userId: user.id,
        title: "Read 10 pages",
        status: "done",
        priority: "low",
        category: "personal",
        dueDate: subDays(today, 1),
        order: 3,
      },
    ],
  })

  console.log(`Seed complete for user ${user.email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
