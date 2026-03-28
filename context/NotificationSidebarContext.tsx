"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface NotificationSidebarContextValue {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    unreadCount: number;
    setUnreadCount: (n: number) => void;
}

const NotificationSidebarContext = createContext<NotificationSidebarContextValue | undefined>(undefined);

export function NotificationSidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    return (
        <NotificationSidebarContext.Provider value={{
            isOpen,
            open: () => setIsOpen(true),
            close: () => setIsOpen(false),
            unreadCount,
            setUnreadCount,
        }}>
            {children}
        </NotificationSidebarContext.Provider>
    );
}

export function useNotificationSidebar() {
    const ctx = useContext(NotificationSidebarContext);
    if (!ctx) throw new Error("useNotificationSidebar must be used inside NotificationSidebarProvider");
    return ctx;
}
