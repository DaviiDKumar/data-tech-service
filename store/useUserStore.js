import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCookie } from 'cookies-next';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      kycStatus: 'pending',
      bankStatus: 'pending',

      // 🔄 SMART UPDATE: Prevents data loss from undefined server responses
      updateUser: (newData) => set((state) => {
        if (!state.user) return state;
        
        const updatedUser = {
          ...state.user,
          // Agar newData mein stats hain toh merge karo, warna purana rakho
          stats: newData.stats ? { ...state.user.stats, ...newData.stats } : state.user.stats,
          // Baki fields ke liye check karo (Nullish coalescing)
          kycStatus: newData.kycStatus ?? state.user.kycStatus,
          bankDetailsStatus: newData.bankDetailsStatus ?? state.user.bankDetailsStatus,
          email: newData.email ?? state.user.email,
          name: newData.name ?? state.user.name,
        };

        return {
          user: updatedUser,
          kycStatus: newData.kycStatus ?? state.kycStatus,
          bankStatus: newData.bankDetailsStatus ?? state.bankStatus,
        };
      }),

      initializeUser: () => {
        const id = getCookie('userId');
        const role = getCookie('role');
        const name = getCookie('userName');
        if (id) {
          set({ user: { id, role, name } });
        }
      },

      setUser: (userData) => set({ user: userData }),
      
      setKycStatus: (status) => set({ kycStatus: status }),
      
      setBankStatus: (status) => set({ bankStatus: status }),
      
      logout: () => {
        set({ user: null, kycStatus: 'pending', bankStatus: 'pending' });
        localStorage.removeItem('user-storage');
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);