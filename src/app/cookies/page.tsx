import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Uso de cookies en Rankeao.cl.",
};

export default function CookiesPage() {
  return (
    <div className="rk-container py-12">
      <section className="surface-panel p-6 sm:p-8 space-y-5">
        <h1 className="section-title">Politica de Cookies</h1>
        <p className="section-subtitle">
          Usamos cookies para mejorar experiencia, seguridad y analitica basica de la plataforma.
        </p>

        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            1. Cookies esenciales: necesarias para autenticacion, sesion y funcionamiento basico.
          </p>
          <p>
            2. Cookies de preferencia: guardan configuraciones de interfaz y personalizacion.
          </p>
          <p>
            3. Cookies de rendimiento: ayudan a medir uso y optimizar tiempos de carga.
          </p>
          <p>
            4. Puedes gestionar cookies desde la configuracion de tu navegador.
          </p>
          <p>
            5. Al continuar navegando, aceptas el uso de cookies segun esta politica.
          </p>
        </div>
      </section>
    </div>
  );
}
