export const APP_NAME = "Vectra"

export const MODULE_COLORS = {
  journal: "#818cf8",
  mood: "#f472b6",
  water: "#38bdf8",
  exercise: "#fb923c",
  food: "#4ade80",
  tasks: "#facc15",
  calendar: "#a78bfa",
  analytics: "#06b6d4",
} as const

export type ExerciseDef = {
  id: string
  name: string
  muscle: string
  difficulty: "beginner" | "intermediate" | "advanced"
  instructions: string
}

export const CALISTHENICS_LIBRARY: ExerciseDef[] = [
  {
    id: "push-ups",
    name: "Push-Ups",
    muscle: "Chest / Triceps",
    difficulty: "beginner",
    instructions:
      "Hands under shoulders, body straight. Lower chest near floor, press up while keeping core tight.",
  },
  {
    id: "pull-ups",
    name: "Pull-Ups",
    muscle: "Back / Biceps",
    difficulty: "intermediate",
    instructions:
      "Hang from bar, palms away. Pull chin over bar, control the descent. Keep shoulders engaged.",
  },
  {
    id: "squats",
    name: "Squats",
    muscle: "Legs / Glutes",
    difficulty: "beginner",
    instructions:
      "Feet shoulder-width, sit hips back and down to parallel. Drive through heels to stand.",
  },
  {
    id: "plank",
    name: "Plank",
    muscle: "Core",
    difficulty: "beginner",
    instructions:
      "Forearms down, elbows under shoulders. Straight line from head to heels, brace abs.",
  },
  {
    id: "dips",
    name: "Dips",
    muscle: "Triceps / Chest",
    difficulty: "intermediate",
    instructions:
      "On parallel bars, lower until elbows ~90°, press up without shrugging shoulders.",
  },
  {
    id: "lunges",
    name: "Lunges",
    muscle: "Legs / Balance",
    difficulty: "beginner",
    instructions:
      "Step forward, drop back knee toward floor. Push through front heel to return.",
  },
  {
    id: "burpees",
    name: "Burpees",
    muscle: "Full Body",
    difficulty: "intermediate",
    instructions:
      "Squat, kick feet to plank, optional push-up, jump feet in, explode upward with hands overhead.",
  },
  {
    id: "mountain-climbers",
    name: "Mountain Climbers",
    muscle: "Core / Cardio",
    difficulty: "beginner",
    instructions:
      "High plank, alternate driving knees toward chest at a quick, controlled pace.",
  },
  {
    id: "jumping-jacks",
    name: "Jumping Jacks",
    muscle: "Cardio",
    difficulty: "beginner",
    instructions:
      "Jump feet out while raising arms overhead, return to start. Stay light on the feet.",
  },
  {
    id: "hollow-body",
    name: "Hollow Body Hold",
    muscle: "Core",
    difficulty: "intermediate",
    instructions:
      "Lie supine, lift shoulders and legs slightly, low back pressed to floor. Hold tension.",
  },
  {
    id: "pike-push-ups",
    name: "Pike Push-Ups",
    muscle: "Shoulders",
    difficulty: "intermediate",
    instructions:
      "Hips high, hands on floor, lower head toward ground between hands, press back up.",
  },
  {
    id: "glute-bridges",
    name: "Glute Bridges",
    muscle: "Glutes",
    difficulty: "beginner",
    instructions:
      "On back, feet planted. Drive hips up, squeeze glutes at top, lower with control.",
  },
  {
    id: "superman",
    name: "Superman Hold",
    muscle: "Lower Back",
    difficulty: "beginner",
    instructions:
      "Prone, lift chest and thighs off floor, arms extended. Hold, breathe steadily.",
  },
  {
    id: "leg-raises",
    name: "Leg Raises",
    muscle: "Core",
    difficulty: "intermediate",
    instructions:
      "Lie supine, legs straight. Lift legs to ~90°, lower slowly without arching low back.",
  },
  {
    id: "diamond-push-ups",
    name: "Diamond Push-Ups",
    muscle: "Triceps",
    difficulty: "intermediate",
    instructions:
      "Hands close forming diamond under chest. Keep elbows tucked as you press.",
  },
]

export const MOTIVATIONAL_QUOTES: string[] = [
  "Small steps every day add up to big change.",
  "Progress, not perfection, is the goal.",
  "Discipline is choosing what you want most over what you want now.",
  "You are stronger than you think.",
  "Consistency beats intensity when intensity is inconsistent.",
  "Show up for yourself — future you is watching.",
  "Energy flows where attention goes.",
  "One workout is better than zero workouts.",
  "Hydration fuels focus and recovery.",
  "Track the wins, learn from the misses.",
  "Your mood is data, not destiny.",
  "Rest is part of the plan.",
  "Courage is doing the next right thing.",
  "Clarity comes from action, not overthinking.",
  "You do not have to be extreme, just consistent.",
  "Celebrate tiny improvements — they compound.",
  "A calm mind is a productive mind.",
  "Nutrition is self-respect in edible form.",
  "Sleep is the edge nobody talks about enough.",
  "You are allowed to reset and try again today.",
]

export function quoteForDay(date = new Date()) {
  const i = date.getDate() % MOTIVATIONAL_QUOTES.length
  return MOTIVATIONAL_QUOTES[i]
}

export const MEAL_PREP_SUGGESTIONS = [
  "Grilled chicken + roasted vegetables + quinoa",
  "Turkey chili + brown rice + side salad",
  "Baked salmon + sweet potato + broccoli",
  "Tofu stir-fry + mixed greens + sesame dressing",
  "Greek yogurt parfait + berries + oats",
]
