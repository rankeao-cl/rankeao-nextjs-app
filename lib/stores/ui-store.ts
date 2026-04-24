"use client";

import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  createPostModalOpen: boolean;
  openCreatePost: () => void;
  closeCreatePost: () => void;
  createDeckModalOpen: boolean;
  openCreateDeck: () => void;
  closeCreateDeck: () => void;
  createListingModalOpen: boolean;
  openCreateListing: () => void;
  closeCreateListing: () => void;
  notificationSidebarOpen: boolean;
  openNotificationSidebar: () => void;
  closeNotificationSidebar: () => void;
  notificationUnreadCount: number;
  setNotificationUnreadCount: (n: number) => void;
  balanceSidebarOpen: boolean;
  openBalanceSidebar: () => void;
  closeBalanceSidebar: () => void;
  depositModalOpen: boolean;
  openDepositModal: () => void;
  closeDepositModal: () => void;
  payoutModalOpen: boolean;
  openPayoutModal: () => void;
  closePayoutModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  createPostModalOpen: false,
  openCreatePost: () => set({ createPostModalOpen: true }),
  closeCreatePost: () => set({ createPostModalOpen: false }),
  createDeckModalOpen: false,
  openCreateDeck: () => set({ createDeckModalOpen: true }),
  closeCreateDeck: () => set({ createDeckModalOpen: false }),
  createListingModalOpen: false,
  openCreateListing: () => set({ createListingModalOpen: true }),
  closeCreateListing: () => set({ createListingModalOpen: false }),
  notificationSidebarOpen: false,
  openNotificationSidebar: () => set({ notificationSidebarOpen: true }),
  closeNotificationSidebar: () => set({ notificationSidebarOpen: false }),
  notificationUnreadCount: 0,
  setNotificationUnreadCount: (n) => set({ notificationUnreadCount: n }),
  balanceSidebarOpen: false,
  openBalanceSidebar: () => set({ balanceSidebarOpen: true }),
  closeBalanceSidebar: () => set({ balanceSidebarOpen: false }),
  depositModalOpen: false,
  openDepositModal: () => set({ depositModalOpen: true, balanceSidebarOpen: false }),
  closeDepositModal: () => set({ depositModalOpen: false }),
  payoutModalOpen: false,
  openPayoutModal: () => set({ payoutModalOpen: true, balanceSidebarOpen: false }),
  closePayoutModal: () => set({ payoutModalOpen: false }),
}));
