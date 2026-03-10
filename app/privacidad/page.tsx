import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Politica de privacidad de Rankeao.cl.",
};

export default function PrivacidadPage() {
  return (
    <div className="rk-container py-12">
      <section className="surface-panel p-6 sm:p-8 space-y-5">
        <h1 className="section-title">Politica de Privacidad</h1>
        <p className="section-subtitle">
          Esta pagina describe como recopilamos, usamos y protegemos datos personales en Rankeao.cl.
        </p>

        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            1. Recopilamos datos necesarios para operar cuentas, rankings, torneos y marketplace.
          </p>
          <p>
            2. No compartimos informacion personal sensible con terceros sin base legal o consentimiento.
          </p>
          <p>
            3. Aplicamos medidas de seguridad para proteger los datos almacenados.
          </p>
          <p>
            4. Puedes solicitar rectificacion o eliminacion de datos segun normativa aplicable.
          </p>
          <p>
            5. Esta politica puede actualizarse cuando existan cambios regulatorios o tecnicos.
          </p>
        </div>
      </section>
    </div>
  );
}
