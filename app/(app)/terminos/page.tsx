import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de la plataforma Rankeao.cl",
};

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">Documento legal</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-3">Términos y Condiciones</h1>
        <p className="text-sm text-[var(--muted)]">Última actualización: 17 de marzo de 2026</p>
      </div>

      <div className="prose-custom space-y-8 text-sm leading-relaxed text-[var(--foreground)]">

        <section>
          <h2>1. Identificación del prestador</h2>
          <p>
            La plataforma <strong>Rankeao.cl</strong> (en adelante, "la Plataforma") es operada y administrada en el territorio de la República de Chile. Para consultas legales o comerciales, puedes contactarnos a través de <a href="mailto:contacto@rankeao.cl">contacto@rankeao.cl</a>.
          </p>
        </section>

        <section>
          <h2>2. Objeto y aceptación</h2>
          <p>
            Los presentes Términos y Condiciones regulan el acceso y uso de los servicios ofrecidos por la Plataforma, que incluyen:
          </p>
          <ul>
            <li>Creación de cuentas de usuario.</li>
            <li>Participación en torneos de juegos de cartas coleccionables (TCG).</li>
            <li>Publicación y consulta de rankings competitivos.</li>
            <li>Marketplace para la compraventa de cartas entre usuarios y tiendas.</li>
            <li>Sistema de mensajería y chat.</li>
            <li>Interacción con comunidades y tiendas locales.</li>
          </ul>
          <p>
            Al registrarte o utilizar cualquier servicio de la Plataforma, aceptas estos Términos en su totalidad. Si no estás de acuerdo con alguna disposición, debes abstenerte de utilizar la Plataforma.
          </p>
        </section>

        <section>
          <h2>3. Registro y cuenta de usuario</h2>
          <p>
            Para acceder a funcionalidades como el marketplace, chat y torneos, debes crear una cuenta proporcionando información veraz y actualizada.
          </p>
          <ul>
            <li><strong>Edad mínima:</strong> Debes tener al menos 14 años para crear una cuenta. Los menores de 18 años que deseen realizar transacciones en el marketplace necesitan autorización de su representante legal, conforme a la Ley 21.719 sobre Protección de Datos Personales.</li>
            <li><strong>Responsabilidad:</strong> Eres responsable de mantener la confidencialidad de tus credenciales y de todas las acciones realizadas desde tu cuenta.</li>
            <li><strong>Suspensión:</strong> Nos reservamos el derecho de suspender o eliminar cuentas que infrinjan estos Términos, sin perjuicio de las acciones legales que correspondan.</li>
          </ul>
        </section>

        <section>
          <h2>4. Marketplace — Compraventa entre usuarios</h2>
          <h3>4.1 Rol de la Plataforma</h3>
          <p>
            Rankeao.cl actúa exclusivamente como <strong>intermediario tecnológico</strong> que facilita el contacto entre compradores y vendedores. La Plataforma <strong>no es parte</strong> de las transacciones de compraventa entre usuarios, conforme a lo establecido en la Ley 19.496 sobre Protección de los Derechos de los Consumidores.
          </p>
          <h3>4.2 Responsabilidades del vendedor</h3>
          <ul>
            <li>Garantizar la veracidad de la descripción, condición y fotografías de los productos publicados.</li>
            <li>Cumplir con los plazos de envío acordados.</li>
            <li>Responder ante el comprador por defectos, vicios ocultos o incumplimientos.</li>
            <li>Emitir boleta o factura cuando corresponda según la legislación tributaria chilena.</li>
          </ul>
          <h3>4.3 Derecho de retracto</h3>
          <p>
            De acuerdo con el artículo 3 bis de la Ley 19.496, el comprador tiene derecho a retractarse de la compra dentro de los <strong>10 días corridos</strong> siguientes a la recepción del producto, siempre que este se encuentre en las mismas condiciones en que fue recibido. Si el vendedor no envió confirmación escrita de la compra, el plazo se extiende a <strong>90 días corridos</strong>.
          </p>
          <h3>4.4 Disputas</h3>
          <p>
            La Plataforma ofrece un sistema de disputas para mediar entre compradores y vendedores. Sin perjuicio de lo anterior, las partes pueden recurrir al Servicio Nacional del Consumidor (SERNAC) o a los tribunales de justicia competentes.
          </p>
          <h3>4.5 Precios</h3>
          <p>
            Los precios publicados deben reflejar el <strong>valor total</strong>, incluyendo impuestos aplicables. Los costos de envío deben ser informados de forma clara antes de confirmar la transacción, conforme al DS N°6 de 2021 del Ministerio de Economía.
          </p>
        </section>

        <section>
          <h2>5. Torneos</h2>
          <ul>
            <li>Los torneos son organizados por tiendas, comunidades o usuarios verificados a través de la Plataforma.</li>
            <li>Las reglas específicas de cada torneo (formato, estructura, premios, inscripción) son definidas por el organizador.</li>
            <li>La Plataforma provee la infraestructura tecnológica para gestión de brackets, emparejamientos y rankings, pero <strong>no es responsable</strong> de la ejecución presencial del evento.</li>
            <li>Los participantes deben cumplir con las reglas del torneo y el código de conducta de la Plataforma.</li>
            <li>La Plataforma se reserva el derecho de invalidar resultados obtenidos mediante fraude o manipulación.</li>
          </ul>
        </section>

        <section>
          <h2>6. Chat y contenido de usuario</h2>
          <ul>
            <li>El servicio de chat permite comunicación entre usuarios para coordinar compras, participar en comunidades y socializar.</li>
            <li>Queda estrictamente prohibido utilizar el chat para: acoso, amenazas, discriminación, difusión de contenido ilegal, spam, phishing o cualquier conducta contraria a la ley chilena.</li>
            <li>La Plataforma puede moderar, eliminar mensajes o suspender cuentas que infrinjan estas normas.</li>
            <li>Los mensajes pueden ser almacenados conforme a nuestra <Link href="/privacidad" className="text-[var(--accent)] hover:underline">Política de Privacidad</Link>.</li>
          </ul>
        </section>

        <section>
          <h2>7. Propiedad intelectual</h2>
          <p>
            Los nombres, logos y marcas de juegos como Pokémon, Magic: The Gathering, Yu-Gi-Oh! y otros son propiedad de sus respectivos titulares. Rankeao.cl no tiene afiliación con ningún editor o distribuidor de juegos.
          </p>
          <p>
            El contenido publicado por los usuarios (fotos, textos, mazos) es de su autoría. Al publicar contenido en la Plataforma, otorgas una licencia no exclusiva, mundial y gratuita para mostrar dicho contenido dentro del contexto de los servicios de Rankeao.cl.
          </p>
        </section>

        <section>
          <h2>8. Conducta prohibida</h2>
          <p>Queda prohibido:</p>
          <ul>
            <li>Crear cuentas falsas o suplantar la identidad de terceros.</li>
            <li>Manipular rankings, resultados de torneos o sistemas de puntuación.</li>
            <li>Publicar listados fraudulentos o engañosos en el marketplace.</li>
            <li>Realizar scraping, ataques o intentos de vulnerar la seguridad de la Plataforma.</li>
            <li>Evadir sanciones mediante la creación de nuevas cuentas.</li>
          </ul>
        </section>

        <section>
          <h2>9. Limitación de responsabilidad</h2>
          <p>
            La Plataforma se proporciona "tal cual" y "según disponibilidad". No garantizamos la disponibilidad ininterrumpida del servicio ni la ausencia de errores. En la máxima medida permitida por la ley chilena:
          </p>
          <ul>
            <li>No somos responsables por las transacciones entre usuarios.</li>
            <li>No somos responsables por la calidad, seguridad o legalidad de los productos publicados.</li>
            <li>No somos responsables por daños indirectos, incidentales o consecuentes derivados del uso de la Plataforma.</li>
          </ul>
        </section>

        <section>
          <h2>10. Legislación aplicable y jurisdicción</h2>
          <p>
            Estos Términos se rigen por las leyes de la República de Chile. Para cualquier controversia derivada del uso de la Plataforma, las partes se someten a la jurisdicción de los tribunales ordinarios de justicia de la ciudad de Santiago de Chile, sin perjuicio del derecho del consumidor a recurrir al SERNAC o al tribunal de su domicilio conforme a la Ley 19.496.
          </p>
        </section>

        <section>
          <h2>11. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones serán comunicadas a través de la Plataforma con al menos <strong>30 días de anticipación</strong> a su entrada en vigencia. El uso continuado de la Plataforma después de dicho plazo implica la aceptación de los nuevos Términos.
          </p>
        </section>

        <section>
          <h2>12. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos Términos, puedes contactarnos en <a href="mailto:contacto@rankeao.cl" className="text-[var(--accent)] hover:underline">contacto@rankeao.cl</a>.
          </p>
        </section>
      </div>

      <style>{`
        .prose-custom h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--foreground);
          margin-bottom: 0.75rem;
        }
        .prose-custom h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--foreground);
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .prose-custom p {
          color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .prose-custom ul {
          list-style: disc;
          padding-left: 1.5rem;
          color: var(--muted);
        }
        .prose-custom ul li {
          margin-bottom: 0.35rem;
        }
        .prose-custom strong {
          color: var(--foreground);
        }
        .prose-custom a {
          color: var(--accent);
        }
        .prose-custom a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
