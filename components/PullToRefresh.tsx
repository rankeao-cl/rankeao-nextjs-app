"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { ArrowRotateRight } from "@gravity-ui/icons";

interface PullToRefreshProps {
    children: ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
    const router = useRouter();
    const [startY, setStartY] = useState(0);
    const [pulling, setPulling] = useState(false);
    const [height, setHeight] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const controls = useAnimation();

    const handleTouchStart = (e: React.TouchEvent) => {
        // Solo permitir pull-to-refresh si estamos arriba de todo
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY === 0 || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0 && window.scrollY === 0) {
            // Prevenir el scroll por defecto del navegador en movil para hacer nuestra animacion
            // (Nota: preventDefault no se puede llamar facilmente en touchmove pasivo en React sin refs, 
            // pero usaremos el overscroll-behavior-y: none en CSS global o container)
            setPulling(true);

            // Resistencia: mientras más tiras, más cuesta
            const resistance = diff < 150 ? diff * 0.5 : 75 + (diff - 150) * 0.1;
            setHeight(Math.min(resistance, 100)); // Maximo 100px de altura
        }
    };

    const handleTouchEnd = useCallback(async () => {
        if (!pulling || isRefreshing) return;

        setPulling(false);
        setStartY(0);

        // Si pasamos el umbral (ej. 60px visuales), disparamos refresh
        if (height > 60) {
            setIsRefreshing(true);
            controls.start({ height: 60, opacity: 1 });

            // Refrescar los datos de la app
            router.refresh();

            // Simular tiempo minimo de recarga visual
            await new Promise(resolve => setTimeout(resolve, 800));

            setIsRefreshing(false);
            controls.start({ height: 0, opacity: 0 });
            setHeight(0);
        } else {
            // Volver a estado original
            controls.start({ height: 0, opacity: 0 });
            setHeight(0);
        }
    }, [pulling, isRefreshing, height, controls, router]);

    return (
        <div
            className="relative w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <motion.div
                className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden z-10"
                animate={controls}
                initial={{ height: 0, opacity: 0 }}
                style={{ height: pulling ? height : undefined }}
            >
                <div
                    className="flex justify-center items-center rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md w-10 h-10 transition-transform"
                    style={{
                        transform: `rotate(${isRefreshing ? 0 : height * 3}deg)`,
                        opacity: height / 60
                    }}
                >
                    <ArrowRotateRight
                        className={`w-5 h-5 text-[var(--foreground)] ${isRefreshing ? "animate-spin" : ""}`}
                    />
                </div>
            </motion.div>
            <div className={`transition-transform duration-300 ${isRefreshing ? "translate-y-[60px]" : ""}`}>
                {children}
            </div>
        </div>
    );
}
