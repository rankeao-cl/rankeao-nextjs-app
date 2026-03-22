"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface CreatePostModalContextValue {
    isOpen: boolean;
    openCreatePost: () => void;
    closeCreatePost: () => void;
}

const CreatePostModalContext = createContext<CreatePostModalContextValue>({
    isOpen: false,
    openCreatePost: () => {},
    closeCreatePost: () => {},
});

export function CreatePostModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openCreatePost = useCallback(() => setIsOpen(true), []);
    const closeCreatePost = useCallback(() => setIsOpen(false), []);

    return (
        <CreatePostModalContext.Provider value={{ isOpen, openCreatePost, closeCreatePost }}>
            {children}
        </CreatePostModalContext.Provider>
    );
}

export function useCreatePostModal() {
    return useContext(CreatePostModalContext);
}
