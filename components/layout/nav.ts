import { MODULE_COLORS } from "@/lib/constants"

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", color: "#06b6d4", icon: "◉" },
  { href: "/journal", label: "Journal", color: MODULE_COLORS.journal, icon: "✎" },
  { href: "/mood", label: "Mood", color: MODULE_COLORS.mood, icon: "☺" },
  { href: "/water", label: "Water", color: MODULE_COLORS.water, icon: "≋" },
  { href: "/exercise", label: "Exercise", color: MODULE_COLORS.exercise, icon: "↯" },
  { href: "/food", label: "Food", color: MODULE_COLORS.food, icon: "⚑" },
  { href: "/tasks", label: "Tasks", color: MODULE_COLORS.tasks, icon: "▤" },
  { href: "/calendar", label: "Calendar", color: MODULE_COLORS.calendar, icon: "▦" },
  { href: "/analytics", label: "Analytics", color: MODULE_COLORS.analytics, icon: "◈" },
] as const
