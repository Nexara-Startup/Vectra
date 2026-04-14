import { create } from "zustand"

export type UserPrefs = {
  waterGoal: number
  calorieGoal: number
  proteinGoal: number
  name: string | null
}

type UserState = {
  prefs: UserPrefs | null
  setPrefs: (p: UserPrefs | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  prefs: null,
  setPrefs: (prefs) => set({ prefs }),
}))
