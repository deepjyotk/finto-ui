import { configureStore } from "@reduxjs/toolkit"
import { authReducer } from "@/features/auth/redux"
import { chatReducer } from "@/features/chat/redux"
import { tickerReducer } from "@/features/ticker/redux"

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    ticker: tickerReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
