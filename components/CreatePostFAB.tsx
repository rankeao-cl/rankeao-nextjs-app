"use client";

import { Pencil } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useCreatePostModal } from "@/context/CreatePostModalContext";

export default function CreatePostFAB() {
    const { status } = useAuth();
    const { openCreatePost } = useCreatePostModal();

    if (status !== "authenticated") return null;

    return (
        <button
            onClick={openCreatePost}
            className="lg:hidden"
            style={{
                position: "fixed",
                bottom: 80,
                right: 16,
                zIndex: 40,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "var(--accent)",
                border: "none",
                boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s, box-shadow 0.15s",
            }}
            aria-label="Crear post"
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = "0 6px 20px color-mix(in srgb, var(--accent) 50%, transparent)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)";
            }}
        >
            <Pencil style={{ width: 22, height: 22, color: "#FFFFFF" }} />
        </button>
    );
}
