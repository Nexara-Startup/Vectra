import type {
  FoodLog,
  Journal,
  MealPlan,
  Mood,
  Prisma,
  Task,
  WaterLog,
} from "@prisma/client"
import type { InsightsBundle } from "@/lib/insights-bundle"

export type BootstrapUser = Prisma.UserGetPayload<{
  select: {
    id: true
    name: true
    email: true
    image: true
    waterGoal: true
    calorieGoal: true
    proteinGoal: true
  }
}>

export type WorkoutWithExercises = Prisma.WorkoutGetPayload<{
  include: { exercises: true }
}>

export type WorkoutLogWithWorkout = Prisma.WorkoutLogGetPayload<{
  include: { workout: true }
}>

export type BootstrapSnapshot = {
  user: BootstrapUser | null
  journals: Journal[]
  moods: Mood[]
  waterLogs: WaterLog[]
  foodLogs: FoodLog[]
  tasks: Task[]
  workouts: WorkoutWithExercises[]
  workoutLogs: WorkoutLogWithWorkout[]
  mealPlans: MealPlan[]
  analytics: InsightsBundle
}
