// store/useAdminStore.js
export const useAdminStore = create((set) => ({
  masterPool: [], // Saare 'Resume' Master entries
  uploadProgress: 0,
  
  setMasterPool: (data) => set({ masterPool: data }),
  updateUploadProgress: (val) => set({ uploadProgress: val }),
}));

