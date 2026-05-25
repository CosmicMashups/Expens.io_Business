import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setMobileSidebarOpen: (v: boolean) => void
  toggleMobileSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
}))
