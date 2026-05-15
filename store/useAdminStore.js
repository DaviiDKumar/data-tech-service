// store/useAdminStore.js
export const useAdminStore = create((set) => ({
  masterPool: [],
  uploadProgress: 0,
  adminStats: null,          // ← add this

  setMasterPool: (data) => set({ masterPool: data }),
  updateUploadProgress: (val) => set({ uploadProgress: val }),
  setAdminStats: (data) => set({ adminStats: data }),   // ← add this
}));