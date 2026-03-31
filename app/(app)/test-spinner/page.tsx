"use client";

import RankeaoSpinner from "@/components/ui/RankeaoSpinner";

export default function TestSpinnerPage() {
    return (
        <>
            {/* Barra de progreso sincronizada con el shimmer del logo (1.4s) */}
            <div style={{
                position: "fixed", top: 0, left: 0, right: 0,
                height: 3, zIndex: 99999, overflow: "hidden",
            }}>
                <style>{`
                    @keyframes rk-bar-sync {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}</style>
                <div style={{
                    width: "100%", height: "100%",
                    background: "linear-gradient(90deg, transparent 0%, var(--foreground) 40%, var(--foreground) 60%, transparent 100%)",
                    animation: "rk-bar-sync 1.4s ease-in-out infinite",
                }} />
            </div>

            <div className="flex items-center justify-center" style={{ minHeight: "80vh" }}>
                <RankeaoSpinner className="h-12 w-auto" />
            </div>
        </>
    );
}
