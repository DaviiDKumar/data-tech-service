// store/useAdminStore.js
import { create } from 'zustand'; // ← Add this line!

export const useAdminStore = create((set) => ({
  masterPool: [],
  uploadProgress: 0,
  adminStats: null,

  setMasterPool: (data) => set({ masterPool: data }),
  updateUploadProgress: (val) => set({ uploadProgress: val }),
  setAdminStats: (data) => set({ adminStats: data }),
}));