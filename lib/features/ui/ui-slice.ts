import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: "light" | "dark"
  isTyping: boolean
}

const initialState: UIState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  theme: "light",
  isTyping: false,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setTheme,
  setTyping,
} = uiSlice.actions
export default uiSlice.reducer
