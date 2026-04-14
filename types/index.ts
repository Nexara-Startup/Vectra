import type {
  User,
  Journal,
  Mood,
  WaterLog,
  Workout,
  WorkoutExercise,
  WorkoutLog,
  FoodLog,
  MealPlan,
  Task,
  WeeklyScore,
} from "@prisma/client"

export type {
  User,
  Journal,
  Mood,
  WaterLog,
  Workout,
  WorkoutExercise,
  WorkoutLog,
  FoodLog,
  MealPlan,
  Task,
  WeeklyScore,
}

export type MealPlanMeal = { name: string; ingredients: string[] }

export type TaskStatus = "todo" | "in_progress" | "done"
export type TaskPriority = "high" | "medium" | "low"
export type TaskCategory = "work" | "personal" | "health" | "other"
