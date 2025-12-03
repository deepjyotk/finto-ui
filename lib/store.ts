import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/auth"
import chatReducer from "./slices/chat"
import uiReducer from "./slices/ui"
import welcomeReducer from "./slices/welcome"

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    ui: uiReducer,
    welcome: welcomeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
