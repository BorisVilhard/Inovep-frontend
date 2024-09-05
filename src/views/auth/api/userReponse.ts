import create from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

// Define the types for the authentication state and actions
type AuthState = {
  id: string | null;
  username: string | null;
  email: string | null;
  accessToken: string | null;
};

type AuthActions = {
  setCredentials: (id: string, username: string, email: string, accessToken: string) => void;
  logOut: () => void;
};

type AuthStore = AuthState & AuthActions;

// Create Zustand store with persistence
const useStore = create<AuthStore>()(
  persist<AuthStore>(
    (set) => ({
      id: null, // default values for state
      username: null,
      email: null,
      accessToken: null,

      // Function to set credentials in state
      setCredentials: (id, username, email, accessToken) =>
        set({ id, username, email, accessToken }),

      // Logout function to clear state and make a backend call to logout
      logOut: () => {
        // Perform a GET request to the logout endpoint
        fetch('http://localhost:3500/logout', {
          method: 'GET',
          credentials: 'include', // Ensure cookies are sent with the request
        })
          .then((response) => {
            if (response.ok) {
              // Clear the Zustand state after successful logout
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
      name: 'auth-storage', // key for localStorage
      getStorage: () => localStorage, // specify localStorage as the storage medium
    } as PersistOptions<AuthStore>,
  ),
);

export default useStore;

// Selector function for accessing the current user state
export const selectCurrentUser = (state: AuthState) => ({
  id: state.id,
  username: state.username,
  email: state.email,
  accessToken: state.accessToken,
});
