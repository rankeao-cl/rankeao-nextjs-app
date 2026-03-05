import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminos",
  description: "Terminos y condiciones de uso de Rankeao.cl.",
};

export default function TerminosPage() {
  return (
    <div className="rk-container py-12">
      <section className="surface-panel p-6 sm:p-8 space-y-5">
        <h1 className="section-title">Terminos y Condiciones</h1>
        <p className="section-subtitle">
          Al usar Rankeao.cl aceptas estas condiciones generales de uso de la plataforma.
        </p>

        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            1. Rankeao.cl conecta jugadores, comunidades y tiendas para eventos y actividad TCG.
          </p>
          <p>
            2. Cada usuario es responsable de la informacion publicada en torneos, rankings y marketplace.
          </p>
          <p>
            3. El uso indebido, fraude o suplantacion puede resultar en suspension de cuenta.
          </p>
          <p>
            4. La plataforma puede actualizar estos terminos para mejorar seguridad y operacion del servicio.
          </p>
          <p>
            5. Para dudas legales o soporte, usa los canales oficiales de contacto de Rankeao.cl.
          </p>
        </div>
      </section>
    </div>
  );
}
