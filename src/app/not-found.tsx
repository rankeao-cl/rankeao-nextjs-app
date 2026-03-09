import Link from "next/link";
import { Button } from "@heroui/react";

export default function NotFound() {
  return (
    <div className="rk-container py-20">
      <div className="surface-panel p-8 sm:p-12 text-center max-w-3xl mx-auto">
        <p className="kicker mb-4">404 / Fuera del meta</p>
        <h1 className="hero-title text-4xl sm:text-6xl mb-4">
          TE PERDISTE EN <span className="hero-title-accent">EL META?</span>
        </h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Esta pagina no existe o fue rotada del formato actual. Vuelve al inicio y sigue compitiendo.
        </p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link href="/">
            <Button variant="primary" className="font-bold">
              Ir al inicio
            </Button>
          </Link>
          <Link href="/torneos">
            <Button variant="secondary">
              Ver torneos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
