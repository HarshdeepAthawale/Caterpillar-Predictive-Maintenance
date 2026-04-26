import { create } from 'zustand'
import type { Prediction, FaultEvent } from '../api/client'

interface AppState {
  machineId: string
  setMachineId: (id: string) => void

  latestPrediction: Prediction | null
  setLatestPrediction: (p: Prediction) => void

  recentEvents: FaultEvent[]
  pushEvent: (e: FaultEvent) => void
  clearEvents: () => void

  isConnected: boolean
  setConnected: (v: boolean) => void

  darkMode: boolean
  toggleDark: () => void
}

export const useStore = create<AppState>((set) => ({
  machineId: 'machine_01',
  setMachineId: (id) => set({ machineId: id }),

  latestPrediction: null,
  setLatestPrediction: (p) => set({ latestPrediction: p }),

  recentEvents: [],
  pushEvent: (e) =>
    set((s) => ({ recentEvents: [e, ...s.recentEvents].slice(0, 200) })),
  clearEvents: () => set({ recentEvents: [] }),

  isConnected: false,
  setConnected: (v) => set({ isConnected: v }),

  darkMode: false,
  toggleDark: () =>
    set((s) => {
      const next = !s.darkMode
      document.documentElement.classList.toggle('dark', next)
      return { darkMode: next }
    }),
}))
