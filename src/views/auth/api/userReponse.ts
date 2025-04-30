import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

type Subscription = {
	planId?: string;
	status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | null;
	activeUntil?: string;
	tokensPerMonth?: number;
	role?: 'regular' | 'company';
	jobLimit?: number;
	visibilityDays?: number;
	canTop?: boolean;
	topDays?: number;
	subscriptionId?: string;
};

type AuthState = {
	id: string | null;
	username: string | null;
	email: string | null;
	accessToken: string | null;
	regNumber: string | null;
	registeredAddress: string | null;
	subscription: Subscription | null;
	tokens: number | null;
	isRehydrated: boolean;
};

// Define the AuthActions type
type AuthActions = {
	setCredentials: (
		id: string,
		username: string,
		email: string,
		accessToken: string | null,
		regNumber?: string,
		registeredAddress?: string,
		subscription?: Subscription,
		tokens?: number
	) => void;
	logOut: () => void;
	refreshAccessToken: () => Promise<boolean>;
	setRehydrated: (value: boolean) => void;
};

// Combine state and actions into a single store type
type AuthStore = AuthState & AuthActions;

// Create the store with persistence
const useAuthStore = create<AuthStore>()(
	persist<AuthStore>(
		(set, get) => ({
			// Initial state
			id: null,
			username: null,
			email: null,
			accessToken: null,
			regNumber: null,
			registeredAddress: null,
			subscription: null,
			tokens: null,
			isRehydrated: false,

			// Action to set user credentials
			setCredentials: (
				id,
				username,
				email,
				accessToken,
				regNumber,
				registeredAddress,
				subscription,
				tokens
			) => {
				console.log('setCredentials called:', {
					id,
					username,
					email,
					accessToken: accessToken ? '[set]' : null,
					regNumber,
					registeredAddress,
					subscription,
					tokens,
				});
				set((state) => ({
					id,
					username,
					email,
					accessToken: accessToken !== null ? accessToken : state.accessToken,
					regNumber: regNumber || null,
					registeredAddress: registeredAddress || null,
					subscription: subscription || state.subscription || null,
					tokens: tokens !== undefined ? tokens : state.tokens,
				}));
			},

			// Action to log out the user
			logOut: () => {
				console.log('Initiating logout...');
				fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logout`, {
					method: 'GET',
					credentials: 'include',
				})
					.then((response) => {
						console.log('Logout response:', response.status);
						set({
							id: null,
							username: null,
							email: null,
							accessToken: null,
							regNumber: null,
							registeredAddress: null,
							subscription: null,
							tokens: null,
							isRehydrated: false,
						});
						window.location.href = '/';
					})
					.catch((error) => {
						console.error('Logout error:', error);
						set({
							id: null,
							username: null,
							email: null,
							accessToken: null,
							regNumber: null,
							registeredAddress: null,
							subscription: null,
							tokens: null,
							isRehydrated: false,
						});
						window.location.href = '/';
					});
			},

			// Action to refresh the access token
			refreshAccessToken: async () => {
				try {
					console.log('Attempting to refresh access token...');
					const response = await fetch(
						`${process.env.NEXT_PUBLIC_BACKEND_URL}/refresh`,
						{
							method: 'GET',
							credentials: 'include',
						}
					);
					console.log('Refresh token response:', response.status);

					if (response.ok) {
						const data = await response.json();
						console.log('New access token received:', data.accessToken);
						set({
							id: data.userId || get().id,
							username: data.username || get().username,
							email: data.email || get().email,
							accessToken: data.accessToken,
							subscription: data.subscription || get().subscription,
							tokens: data.tokens || get().tokens,
						});
						return true;
					} else {
						const errorText = await response.text();
						console.error('Token refresh failed:', response.status, errorText);
						if (response.status === 401) {
							console.log('Unauthorized, logging out...');
							get().logOut();
						}
						return false;
					}
				} catch (error) {
					console.error('Failed to refresh access token:', error);
					get().logOut();
					return false;
				}
			},

			setRehydrated: (value) => {
				set({ isRehydrated: value });
			},
		}),
		{
			name: 'auth-storage',
			getStorage: () => localStorage,
			onRehydrateStorage: () => (state) => {
				if (state) {
					state.setRehydrated(true);
				}
			},
		} as PersistOptions<AuthStore>
	)
);

export const selectCurrentUser = (state: AuthState) => ({
	id: state.id,
	username: state.username,
	email: state.email,
	accessToken: state.accessToken,
	regNumber: state.regNumber,
	registeredAddress: state.registeredAddress,
	subscription: state.subscription,
	tokens: state.tokens,
});

export default useAuthStore;
