// store/useWorkspaceStore.js
import { create } from 'zustand'; // <-- ADD THIS LINE

export const useWorkspaceStore = create((set) => ({
  assignedResumes: [], 
  activeInstance: null, 
  stats: {
    pending: 0,
    submitted: 0,
    rejected: 0
  },

  setAssigned: (data) => set({ assignedResumes: data }),
  setActive: (instance) => set({ activeInstance: instance }),
  updateStats: (newStats) => set((state) => ({ 
    stats: { ...state.stats, ...newStats } 
  })),
}));