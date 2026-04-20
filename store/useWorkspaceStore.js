// store/useWorkspaceStore.js
export const useWorkspaceStore = create((set) => ({
  assignedResumes: [], // ResumeInstance Schema ka data
  activeInstance: null, // Jo resume abhi screen par khula hai
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