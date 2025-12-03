import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser, AuthState as AuthStateType } from "@/types/auth";

export type User = AuthUser;

export interface AuthState extends AuthStateType {}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { setUser, logout, setLoading, setAuthenticated } = authSlice.actions;
export default authSlice.reducer;
