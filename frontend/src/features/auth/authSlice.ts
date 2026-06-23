import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  id: string;
  name: string;
  role: 'advisor' | 'client';
}

interface AuthState {
  token?: string;
  user?: AuthUser;
}

const initialState: AuthState = {
  token: localStorage.getItem('af_engage_token') ?? undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('af_engage_token', action.payload.token);
    },
    clearCredentials(state) {
      state.token = undefined;
      state.user = undefined;
      localStorage.removeItem('af_engage_token');
    },
  },
});

export const { clearCredentials, setCredentials } = authSlice.actions;
export default authSlice.reducer;
