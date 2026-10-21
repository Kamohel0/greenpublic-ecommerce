import { create } from "zustand";
import { getProfile } from "@/api/authApi";

const useAuthStore = create((set, get) => ({
  // Initial state - ALWAYS logged out until proven otherwise
  isAuthenticated: false,
  user: null,
  loading: true, // Start with loading true so we can check token validity
  error: null,

  // Initialize auth state from localStorage token
  initialize: async () => {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      set({ isAuthenticated: false, user: null, loading: false });
      return;
    }

    try {
      // Validate token by fetching profile
      const response = await getProfile();
      const userData = response?.data?.data?.user || response?.data?.user || null;

      if (userData) {
        set({
          isAuthenticated: true,
          user: userData,
          loading: false,
          error: null,
        });
      } else {
        // Invalid response, clear auth
        get().logout();
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      // Token is invalid, clear it
      get().logout();
    }
  },

  // Login action
  login: (accessToken, userData) => {
    localStorage.setItem("accessToken", accessToken);
    set({
      isAuthenticated: true,
      user: userData,
      loading: false,
      error: null,
    });
  },

  // Logout action
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  },

  // Update user data
  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },

  // Set error
  setError: (error) => {
    set({ error, loading: false });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;
