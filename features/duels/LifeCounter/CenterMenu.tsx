"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CenterMenuProps {
    onHistory: () => void;
    onReset: () => void;
    onSettings: () => void;
    onEnd: () => void;
}

const MENU_ITEMS = [
    { id: "history", label: "Historial", icon: "📜", angle: -90 },
    { id: "reset", label: "Reiniciar", icon: "🔄", angle: -30 },
    { id: "end", label: "Terminar", icon: "🏁", angle: 30 },
    { id: "settings", label: "Opciones", icon: "⚙️", angle: 90 },
] as const;

const RADIAL_DISTANCE = 72;

export default function CenterMenu({
    onHistory,
    onReset,
    onSettings,
    onEnd,
}: CenterMenuProps) {
    const [open, setOpen] = useState(false);

    const handleAction = (id: (typeof MENU_ITEMS)[number]["id"]) => {
        setOpen(false);
        switch (id) {
            case "history":
                onHistory();
                break;
            case "reset":
                onReset();
                break;
            case "settings":
                onSettings();
                break;
            case "end":
                onEnd();
                break;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0"
                        style={{ zIndex: 48 }}
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Radial items */}
            <AnimatePresence>
                {open &&
                    MENU_ITEMS.map((item, i) => {
                        const rad = (item.angle * Math.PI) / 180;
                        const x = Math.sin(rad) * RADIAL_DISTANCE;
                        const y = -Math.cos(rad) * RADIAL_DISTANCE;
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                                animate={{ opacity: 1, x, y, scale: 1 }}
                                exit={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                                transition={{ delay: i * 0.04, type: "spring", damping: 20, stiffness: 350 }}
                                onClick={() => handleAction(item.id)}
                                className="absolute flex flex-col items-center gap-1 rounded-2xl"
                                style={{
                                    zIndex: 50,
                                    top: "50%",
                                    left: "50%",
                                    transform: `translate(-50%, -50%)`,
                                    background: "rgba(20,20,28,0.95)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    padding: "10px 14px",
                                    minWidth: 60,
                                    backdropFilter: "blur(12px)",
                                    cursor: "pointer",
                                }}
                                aria-label={item.label}
                            >
                                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{item.icon}</span>
                                <span
                                    className="text-white font-semibold"
                                    style={{ fontSize: "0.6rem", whiteSpace: "nowrap" }}
                                >
                                    {item.label}
                                </span>
                            </motion.button>
                        );
                    })}
            </AnimatePresence>

            {/* Trigger button */}
            <motion.button
                onClick={() => setOpen((v) => !v)}
                whileTap={{ scale: 0.92 }}
                className="absolute flex items-center justify-center rounded-full"
                style={{
                    zIndex: 51,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 44,
                    height: 44,
                    background: open
                        ? "rgba(99,102,241,0.9)"
                        : "rgba(10,10,16,0.9)",
                    border: `2px solid ${open ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.2)"}`,
                    backdropFilter: "blur(12px)",
                    cursor: "pointer",
                    transition: "background 0.2s, border-color 0.2s",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                }}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={open}
            >
                <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-bold"
                    style={{ fontSize: "1.2rem", color: "white", lineHeight: 1 }}
                >
                    {open ? "×" : "≡"}
                </motion.span>
            </motion.button>
        </>
    );
}
