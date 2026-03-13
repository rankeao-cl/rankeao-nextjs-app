"use client";

import { useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, useAnimation, PanInfo } from "framer-motion";

interface SwipeWrapperProps {
    children: ReactNode;
}

// Rutas principales en orden (tabs del bottom nav)
const MAIN_ROUTES = ["/", "/torneos", "/comunidades", "/notificaciones", "/perfil/me"];

const SWIPE_THRESHOLD = 100;

export default function SwipeWrapper({ children }: SwipeWrapperProps) {
    const router = useRouter();
    const pathname = usePathname();
    const controls = useAnimation();
    const constraintRef = useRef<HTMLDivElement>(null);

    const handleDragEnd = async (
        event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        // Solo permitimos swipe en las rutas principales (para no interferir con otras vistas)
        const isMainRoute = MAIN_ROUTES.includes(pathname);
        if (!isMainRoute) return;

        const offset = info.offset.x;
        const velocity = info.velocity.x;

        const currentIdx = MAIN_ROUTES.indexOf(pathname);

        // Swipe derecha (ir a vista anterior/izquierda)
        if (offset > SWIPE_THRESHOLD || velocity > 500) {
            if (currentIdx > 0) {
                await controls.start({ x: 300, opacity: 0, transition: { duration: 0.2 } });
                router.push(MAIN_ROUTES[currentIdx - 1]);
                // Restablecer posición para navegación sin recarga completa
                setTimeout(() => controls.set({ x: 0, opacity: 1 }), 300);
            } else {
                // Efecto rebote si estamos en la primera tab
                controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
            }
        }
        // Swipe izquierda (ir a vista siguiente/derecha)
        else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
            if (currentIdx < MAIN_ROUTES.length - 1 && currentIdx !== -1) {
                await controls.start({ x: -300, opacity: 0, transition: { duration: 0.2 } });
                router.push(MAIN_ROUTES[currentIdx + 1]);
                // Restablecer
                setTimeout(() => controls.set({ x: 0, opacity: 1 }), 300);
            } else {
                // Efecto rebote si estamos en la ultima tab
                controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
            }
        } else {
            // Devolver a la posición original
            controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
        }
    };

    return (
        <div ref={constraintRef} className="w-full h-full overflow-hidden relative">
            <motion.div
                className="w-full h-full"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
            >
                {children}
            </motion.div>
        </div>
    );
}
