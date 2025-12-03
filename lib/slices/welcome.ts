import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface WelcomeState {
  hasSeenWelcome: boolean;
}

const initialState: WelcomeState = {
  hasSeenWelcome: false,
};

const welcomeSlice = createSlice({
  name: "welcome",
  initialState,
  reducers: {
    setHasSeenWelcome: (state, action: PayloadAction<boolean>) => {
      state.hasSeenWelcome = action.payload;
    },
  },
});

export const { setHasSeenWelcome } = welcomeSlice.actions;
export default welcomeSlice.reducer;
