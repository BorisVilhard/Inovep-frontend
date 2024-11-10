import create from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

type AuthState = {
  id: string | null;
  username: string | null;
  email: string | null;
  accessToken: string | null;
};

type AuthActions = {
  setCredentials: (id: string, username: string, email: string, accessToken: string | null) => void;
  logOut: () => void;
};

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist<AuthStore>(
    (set) => ({
      id: null,
      username: null,
      email: null,
      accessToken: null,

      setCredentials: (id, username, email, accessToken) =>
        set({ id, username, email, accessToken }),

      logOut: () => {
        fetch('http://localhost:3500/logout', {
          method: 'GET',
          credentials: 'include',
        })
          .then((response) => {
            if (response.ok) {
              set({ id: null, username: null, email: null, accessToken: null });
            } else {
              console.error('Failed to log out');
            }
          })
          .catch((error) => {
            console.error('Logout error:', error);
          });
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    } as PersistOptions<AuthStore>,
  ),
);

export default useAuthStore;

export const selectCurrentUser = (state: AuthState) => ({
  id: state.id,
  username: state.username,
  email: state.email,
  accessToken: state.accessToken,
});
