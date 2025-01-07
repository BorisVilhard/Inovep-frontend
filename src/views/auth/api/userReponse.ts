import create from 'zustand';
import { persist } from 'zustand/middleware';
import jwt_decode from 'jwt-decode';

type AuthState = {
  id: string | null;
  username: string | null;
  email: string | null;
  accessToken: string | null;
};

type AuthActions = {
  setCredentials: (id: string, username: string, email: string, accessToken: string | null) => void;
  logOut: () => void;
  refreshAccessToken: () => Promise<void>;
};

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      id: null,
      username: null,
      email: null,
      accessToken: null,

      setCredentials: (id, username, email, accessToken) =>
        set({ id, username, email, accessToken }),

      logOut: async () => {
        try {
          const response = await fetch('http://localhost:3500/logout', {
            method: 'GET',
            credentials: 'include',
          });
          if (response.ok) {
            set({ id: null, username: null, email: null, accessToken: null });
          } else {
            console.error('Failed to log out');
          }
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      refreshAccessToken: async () => {
        try {
          const response = await fetch('http://localhost:3500/refresh-token', {
            method: 'GET',
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            set({ accessToken: data.accessToken });
          } else {
            set({ id: null, username: null, email: null, accessToken: null });
            window.location.href = '/auth/login';
          }
        } catch (error) {
          console.error('Failed to refresh access token:', error);
          set({ id: null, username: null, email: null, accessToken: null });
          window.location.href = '/auth/login';
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    },
  ),
);

export default useAuthStore;

export const selectCurrentUser = (state: AuthState) => ({
  id: state.id,
  username: state.username,
  email: state.email,
  accessToken: state.accessToken,
});
