import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Política de cookies de la plataforma Rankeao.cl",
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">Documento legal</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-3">Política de Cookies</h1>
        <p className="text-sm text-[var(--muted)]">Última actualización: 20 de marzo de 2026</p>
      </div>

      <div className="prose-custom space-y-8 text-sm leading-relaxed text-[var(--foreground)]">

        <section>
          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (computador, tablet o teléfono móvil) cuando visitas un sitio web. Son ampliamente utilizadas para hacer que los sitios web funcionen de manera más eficiente y para proporcionar información a los propietarios del sitio.
          </p>
        </section>

        <section>
          <h2>2. ¿Qué cookies utilizamos?</h2>
          <p>En <strong>Rankeao.cl</strong> utilizamos los siguientes tipos de cookies:</p>

          <h3>2.1 Cookies esenciales</h3>
          <p>
            Son necesarias para el funcionamiento básico de la Plataforma. Incluyen cookies de sesión y autenticación que te permiten iniciar sesión y mantener tu sesión activa. No se pueden desactivar.
          </p>

          <h3>2.2 Cookies de preferencias</h3>
          <p>
            Permiten recordar tus preferencias de uso, como el tema visual (claro/oscuro), idioma y configuraciones de notificaciones.
          </p>

          <h3>2.3 Cookies analíticas</h3>
          <p>
            Nos ayudan a entender cómo los usuarios interactúan con la Plataforma, permitiéndonos mejorar la experiencia de usuario. Estas cookies recopilan información de forma anónima y agregada.
          </p>
        </section>

        <section>
          <h2>3. Cookies de terceros</h2>
          <p>
            Algunos servicios de terceros integrados en la Plataforma pueden establecer sus propias cookies. Estos servicios incluyen proveedores de autenticación y herramientas de análisis. Cada proveedor tiene su propia política de privacidad y cookies.
          </p>
        </section>

        <section>
          <h2>4. ¿Cómo controlar las cookies?</h2>
          <p>
            Puedes controlar y eliminar las cookies a través de la configuración de tu navegador. Ten en cuenta que la eliminación o bloqueo de cookies esenciales puede afectar el funcionamiento de la Plataforma.
          </p>
          <ul>
            <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
            <li><strong>Firefox:</strong> Configuración → Privacidad y seguridad → Cookies y datos del sitio</li>
            <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies y datos de sitios web</li>
            <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
          </ul>
        </section>

        <section>
          <h2>5. Base legal</h2>
          <p>
            El uso de cookies esenciales se basa en nuestro interés legítimo de proporcionar un servicio funcional. Para cookies no esenciales, solicitamos tu consentimiento conforme a la Ley 21.719 sobre Protección de Datos Personales.
          </p>
        </section>

        <section>
          <h2>6. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta Política de Cookies para reflejar cambios en nuestras prácticas o en la legislación aplicable. Te notificaremos de cualquier cambio significativo a través de la Plataforma.
          </p>
        </section>

        <section>
          <h2>7. Contacto</h2>
          <p>
            Si tienes preguntas sobre nuestra Política de Cookies, puedes contactarnos en{" "}
            <a href="mailto:contacto@rankeao.cl" className="text-[var(--accent)] hover:underline">contacto@rankeao.cl</a>.
          </p>
          <p>
            También puedes consultar nuestra{" "}
            <Link href="/privacidad" className="text-[var(--accent)] hover:underline">Política de Privacidad</Link>{" "}
            y nuestros{" "}
            <Link href="/terminos" className="text-[var(--accent)] hover:underline">Términos y Condiciones</Link>.
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
