import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Role = 'ADVISOR' | 'CLIENT' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  clientId?: string;
}

interface AuthState {
  token?: string;
  user?: AuthUser;
  role?: Role;
  isAuthenticated: boolean;
}

function loadStoredUser(): AuthUser | undefined {
  const storedUser = localStorage.getItem('af_engage_user');
  if (!storedUser) {
    return undefined;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem('af_engage_user');
    return undefined;
  }
}

const storedUser = loadStoredUser();
const storedToken = localStorage.getItem('af_engage_token') ?? undefined;

const initialState: AuthState = {
  token: storedToken,
  user: storedUser,
  role: storedUser?.role,
  isAuthenticated: Boolean(storedToken && storedUser),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.role = action.payload.user.role;
      state.isAuthenticated = true;
      localStorage.setItem('af_engage_token', action.payload.token);
      localStorage.setItem('af_engage_user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.token = undefined;
      state.user = undefined;
      state.role = undefined;
      state.isAuthenticated = false;
      localStorage.removeItem('af_engage_token');
      localStorage.removeItem('af_engage_user');
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
