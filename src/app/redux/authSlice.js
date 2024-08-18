import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { username: null, image: null, email: null },
  reducers: {
    setCredentials: (state, action) => {
      const { username, image, email } = action.payload; // Adjusted to direct payload
      state.username = username;
      state.image = image;
      state.email = email;
    },
    logOut: (state) => {
      state.username = null;
      state.image = null;
      state.email = null;
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => ({
  username: state.auth.username,
  image: state.auth.image,
  email: state.auth.email,
});
