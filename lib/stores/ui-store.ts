"use client";

import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  createPostModalOpen: boolean;
  openCreatePost: () => void;
  closeCreatePost: () => void;
  notificationSidebarOpen: boolean;
  openNotificationSidebar: () => void;
  closeNotificationSidebar: () => void;
  notificationUnreadCount: number;
  setNotificationUnreadCount: (n: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  createPostModalOpen: false,
  openCreatePost: () => set({ createPostModalOpen: true }),
  closeCreatePost: () => set({ createPostModalOpen: false }),
  notificationSidebarOpen: false,
  openNotificationSidebar: () => set({ notificationSidebarOpen: true }),
  closeNotificationSidebar: () => set({ notificationSidebarOpen: false }),
  notificationUnreadCount: 0,
  setNotificationUnreadCount: (n) => set({ notificationUnreadCount: n }),
}));
