"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { ArrowRotateRight } from "@gravity-ui/icons";

interface PullToRefreshProps {
    children: ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const controls = useAnimation();

    // Use refs to avoid re-renders during touch tracking
    const startYRef = useRef(0);
    const pullingRef = useRef(false);
    const heightRef = useRef(0);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const spinnerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            startYRef.current = e.touches[0].clientY;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (startYRef.current === 0 || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startYRef.current;

        if (diff > 0 && window.scrollY === 0) {
            pullingRef.current = true;
            const resistance = diff < 150 ? diff * 0.5 : 75 + (diff - 150) * 0.1;
            heightRef.current = Math.min(resistance, 100);

            // Directly update DOM instead of triggering React re-renders
            if (indicatorRef.current) {
                indicatorRef.current.style.height = `${heightRef.current}px`;
                indicatorRef.current.style.opacity = "1";
            }
            if (spinnerRef.current) {
                spinnerRef.current.style.transform = `rotate(${heightRef.current * 3}deg)`;
                spinnerRef.current.style.opacity = `${heightRef.current / 60}`;
            }
        }
    }, [isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!pullingRef.current || isRefreshing) return;

        pullingRef.current = false;
        startYRef.current = 0;
        const currentHeight = heightRef.current;

        if (currentHeight > 60) {
            setIsRefreshing(true);
            controls.start({ height: 60, opacity: 1 });
            router.refresh();
            await new Promise(resolve => setTimeout(resolve, 800));
            setIsRefreshing(false);
            controls.start({ height: 0, opacity: 0 });
        } else {
            controls.start({ height: 0, opacity: 0 });
        }

        heightRef.current = 0;
        if (indicatorRef.current) {
            indicatorRef.current.style.height = "0px";
            indicatorRef.current.style.opacity = "0";
        }
    }, [isRefreshing, controls, router]);

    return (
        <div
            className="relative w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <motion.div
                ref={indicatorRef}
                className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden z-10"
                animate={controls}
                initial={{ height: 0, opacity: 0 }}
            >
                <div
                    ref={spinnerRef}
                    className="flex justify-center items-center rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md w-10 h-10"
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
