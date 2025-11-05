import { configureStore } from "@reduxjs/toolkit"
import chatReducer from "./features/chat/chat-slice"
import authReducer from "./features/auth/auth-slice"
import uiReducer from "./features/ui/ui-slice"

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
