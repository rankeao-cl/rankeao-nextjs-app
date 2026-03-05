"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="rk-container py-20">
      <div className="surface-panel p-8 sm:p-12 text-center max-w-3xl mx-auto">
        <p className="kicker mb-4">Error del servidor</p>
        <h1 className="section-title mb-4">La mesa se dio vuelta, pero seguimos en juego</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Ocurrio un error inesperado al cargar esta vista. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Button onPress={reset} className="bg-gradient-to-r from-purple-600 to-red-500 text-white font-bold">
            Reintentar
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-cyan-400/60 text-cyan-300">
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
