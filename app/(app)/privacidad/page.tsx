import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y protección de datos personales de Rankeao.cl",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">Protección de datos</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-3">Política de Privacidad</h1>
        <p className="text-sm text-[var(--muted)]">Última actualización: 17 de marzo de 2026</p>
      </div>

      <div className="prose-custom space-y-8 text-sm leading-relaxed text-[var(--foreground)]">

        <section>
          <p className="text-[var(--muted)]">
            En <strong>Rankeao.cl</strong> (en adelante, "la Plataforma") nos comprometemos a proteger tu privacidad y tus datos personales conforme a la <strong>Ley 19.628 sobre Protección de la Vida Privada</strong>, la <strong>Ley 21.719 sobre Protección de Datos Personales</strong> y demás normativa aplicable de la República de Chile.
          </p>
          <p className="text-[var(--muted)]">
            Esta Política explica qué datos recopilamos, cómo los usamos, con quién los compartimos y cómo puedes ejercer tus derechos.
          </p>
        </section>

        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de tus datos personales es la entidad que opera Rankeao.cl, con domicilio en Chile. Para consultas relacionadas con protección de datos, puedes escribir a <a href="mailto:privacidad@rankeao.cl">privacidad@rankeao.cl</a>.
          </p>
        </section>

        <section>
          <h2>2. Datos personales que recopilamos</h2>
          <h3>2.1 Datos que proporcionas directamente</h3>
          <ul>
            <li><strong>Registro:</strong> nombre de usuario, dirección de correo electrónico, contraseña (almacenada de forma cifrada).</li>
            <li><strong>Perfil:</strong> foto de avatar, banner, biografía, ciudad, país.</li>
            <li><strong>Marketplace:</strong> datos de publicaciones (título, descripción, precio, fotos de productos), ciudad y región para ubicación del vendedor.</li>
            <li><strong>Torneos:</strong> historial de participación, resultados, ranking ELO.</li>
            <li><strong>Chat:</strong> contenido de mensajes enviados a otros usuarios.</li>
          </ul>
          <h3>2.2 Datos recopilados automáticamente</h3>
          <ul>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, resolución de pantalla.</li>
            <li><strong>Datos de uso:</strong> páginas visitadas, tiempo de permanencia, acciones realizadas en la Plataforma.</li>
            <li><strong>Cookies:</strong> identificadores almacenados en tu navegador para mantener tu sesión activa y mejorar la experiencia. Ver sección 8 (Cookies).</li>
          </ul>
          <h3>2.3 Datos sensibles</h3>
          <p>
            <strong>No recopilamos datos sensibles</strong> (origen racial, opiniones políticas, convicciones religiosas, datos de salud o vida sexual) según la definición del artículo 2 letra g) de la Ley 19.628.
          </p>
        </section>

        <section>
          <h2>3. Finalidad del tratamiento</h2>
          <p>Tratamos tus datos personales para las siguientes finalidades:</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 pr-4 text-[var(--foreground)] font-bold">Finalidad</th>
                <th className="text-left py-2 text-[var(--foreground)] font-bold">Base legal</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">Gestión de tu cuenta de usuario</td>
                <td className="py-2">Ejecución de contrato</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">Funcionamiento del marketplace</td>
                <td className="py-2">Ejecución de contrato</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">Gestión de torneos y rankings</td>
                <td className="py-2">Ejecución de contrato</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">Servicio de mensajería/chat</td>
                <td className="py-2">Ejecución de contrato</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">Envío de notificaciones del sistema</td>
                <td className="py-2">Interés legítimo</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">Mejora del servicio y análisis de uso</td>
                <td className="py-2">Interés legítimo</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">Prevención de fraude y seguridad</td>
                <td className="py-2">Interés legítimo / Obligación legal</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Comunicaciones promocionales</td>
                <td className="py-2">Consentimiento</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>4. Tus derechos (Derechos ARCO)</h2>
          <p>
            Conforme a la Ley 19.628 y la Ley 21.719, tienes los siguientes derechos sobre tus datos personales, los cuales son <strong>irrenunciables y gratuitos</strong>:
          </p>
          <ul>
            <li><strong>Acceso:</strong> Derecho a conocer qué datos personales tuyos tratamos, con qué finalidad y a quién los hemos comunicado.</li>
            <li><strong>Rectificación:</strong> Derecho a corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión (Cancelación):</strong> Derecho a solicitar la eliminación de tus datos cuando ya no sean necesarios, revoques tu consentimiento o no exista justificación legal para su tratamiento.</li>
            <li><strong>Oposición:</strong> Derecho a oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
            <li><strong>Portabilidad:</strong> Derecho a recibir tus datos en un formato estructurado y de uso común, y a transferirlos a otro responsable.</li>
            <li><strong>Oposición a decisiones automatizadas:</strong> Derecho a no ser objeto de decisiones basadas únicamente en tratamiento automatizado que produzcan efectos jurídicos o significativos.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, envía un correo a <a href="mailto:privacidad@rankeao.cl">privacidad@rankeao.cl</a> indicando tu nombre de usuario y el derecho que deseas ejercer. Responderemos dentro de <strong>30 días hábiles</strong>, prorrogables por otros 30 días en casos complejos.
          </p>
          <p>
            También puedes eliminar tu cuenta directamente desde la sección de <Link href="/config" className="text-[var(--accent)] hover:underline">Configuración</Link> de tu perfil.
          </p>
        </section>

        <section>
          <h2>5. Conservación de datos</h2>
          <ul>
            <li><strong>Cuenta activa:</strong> Conservamos tus datos mientras tu cuenta esté activa.</li>
            <li><strong>Eliminación de cuenta:</strong> Al eliminar tu cuenta, tus datos personales se eliminan dentro de 30 días. Algunos datos pueden conservarse de forma anonimizada para fines estadísticos.</li>
            <li><strong>Mensajes:</strong> Los mensajes de chat se conservan mientras la cuenta esté activa. Al eliminar tu cuenta, tus mensajes se anonimizan.</li>
            <li><strong>Transacciones del marketplace:</strong> Los registros de transacciones se conservan por el plazo legal requerido (mínimo 6 años según normativa tributaria chilena).</li>
            <li><strong>Rankings y torneos:</strong> Los resultados históricos de torneos y rankings se conservan de forma pública como parte del registro competitivo.</li>
          </ul>
        </section>

        <section>
          <h2>6. Compartición de datos</h2>
          <p>No vendemos tus datos personales. Compartimos información únicamente en los siguientes casos:</p>
          <ul>
            <li><strong>Otros usuarios:</strong> Tu nombre de usuario, avatar, ciudad y datos de perfil público son visibles para otros usuarios.</li>
            <li><strong>Marketplace:</strong> Al publicar un listado, tu nombre de usuario, ciudad y región son visibles para potenciales compradores.</li>
            <li><strong>Proveedores de servicios:</strong> Utilizamos servicios de terceros para hosting, almacenamiento y procesamiento (como servicios en la nube). Estos proveedores procesan datos bajo nuestras instrucciones y están obligados contractualmente a protegerlos.</li>
            <li><strong>Requerimiento legal:</strong> Podremos divulgar datos personales cuando sea requerido por ley, orden judicial o autoridad competente chilena.</li>
          </ul>
        </section>

        <section>
          <h2>7. Transferencia internacional de datos</h2>
          <p>
            Tus datos pueden ser transferidos y almacenados en servidores ubicados fuera de Chile (por ejemplo, servicios de hosting en Estados Unidos o Europa). En estos casos, nos aseguramos de que existan garantías adecuadas conforme a la Ley 21.719, tales como:
          </p>
          <ul>
            <li>Países con nivel adecuado de protección reconocido.</li>
            <li>Cláusulas contractuales tipo que garanticen la protección de tus datos.</li>
          </ul>
          <p>
            Puedes solicitar información sobre las transferencias internacionales escribiendo a <a href="mailto:privacidad@rankeao.cl">privacidad@rankeao.cl</a>.
          </p>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <h3>8.1 Qué cookies utilizamos</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 pr-3 text-[var(--foreground)] font-bold">Tipo</th>
                <th className="text-left py-2 pr-3 text-[var(--foreground)] font-bold">Finalidad</th>
                <th className="text-left py-2 text-[var(--foreground)] font-bold">Duración</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-3 font-medium text-[var(--foreground)]">Esenciales</td>
                <td className="py-2 pr-3">Mantener tu sesión activa, recordar preferencias de tema</td>
                <td className="py-2">Sesión / 1 año</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 pr-3 font-medium text-[var(--foreground)]">Funcionales</td>
                <td className="py-2 pr-3">Almacenar configuración de idioma y preferencias de interfaz</td>
                <td className="py-2">1 año</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-medium text-[var(--foreground)]">Analíticas</td>
                <td className="py-2 pr-3">Entender cómo se usa la Plataforma para mejorar el servicio</td>
                <td className="py-2">2 años</td>
              </tr>
            </tbody>
          </table>
          <h3>8.2 Gestión de cookies</h3>
          <p>
            Puedes configurar tu navegador para rechazar cookies no esenciales o eliminar las existentes. Ten en cuenta que desactivar cookies esenciales puede afectar el funcionamiento de la Plataforma.
          </p>
        </section>

        <section>
          <h2>9. Protección de menores</h2>
          <p>
            Conforme a la Ley 21.719:
          </p>
          <ul>
            <li>Los menores de <strong>14 años</strong> no pueden crear una cuenta sin el consentimiento verificable de sus padres o representantes legales.</li>
            <li>Los usuarios entre <strong>14 y 17 años</strong> pueden crear una cuenta, pero no pueden realizar transacciones en el marketplace sin autorización de su representante legal.</li>
            <li>No utilizamos datos de menores con fines comerciales o publicitarios.</li>
            <li>Si detectamos que un menor de 14 años ha creado una cuenta sin autorización, procederemos a eliminarla y sus datos asociados.</li>
          </ul>
        </section>

        <section>
          <h2>10. Seguridad de los datos</h2>
          <p>
            Implementamos medidas técnicas y organizativas para proteger tus datos personales contra acceso no autorizado, pérdida, alteración o destrucción, incluyendo:
          </p>
          <ul>
            <li>Cifrado de contraseñas mediante algoritmos seguros (bcrypt/argon2).</li>
            <li>Comunicaciones cifradas mediante HTTPS/TLS.</li>
            <li>Tokens de autenticación con expiración temporal (JWT).</li>
            <li>Control de acceso basado en roles para datos administrativos.</li>
            <li>Monitoreo continuo de accesos y actividad sospechosa.</li>
          </ul>
        </section>

        <section>
          <h2>11. Notificación de incidentes de seguridad</h2>
          <p>
            En caso de un incidente de seguridad que afecte tus datos personales, conforme a la Ley 21.719:
          </p>
          <ul>
            <li>Notificaremos a la <strong>Agencia de Protección de Datos Personales</strong> sin dilación indebida.</li>
            <li>Si el incidente involucra datos sensibles, datos financieros o datos de menores, te notificaremos directamente en un lenguaje claro y accesible.</li>
            <li>Mantenemos un registro documentado de todos los incidentes de seguridad.</li>
          </ul>
        </section>

        <section>
          <h2>12. Modificaciones a esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente. Las modificaciones sustanciales serán comunicadas a través de la Plataforma con al menos <strong>30 días de anticipación</strong>. Te recomendamos revisar esta página regularmente.
          </p>
        </section>

        <section>
          <h2>13. Contacto y reclamaciones</h2>
          <p>
            Para ejercer tus derechos, realizar consultas o presentar reclamaciones sobre el tratamiento de tus datos personales:
          </p>
          <ul>
            <li><strong>Correo:</strong> <a href="mailto:privacidad@rankeao.cl">privacidad@rankeao.cl</a></li>
          </ul>
          <p>
            Si consideras que el tratamiento de tus datos vulnera tus derechos, puedes presentar una reclamación ante la <strong>Agencia de Protección de Datos Personales</strong> de Chile (una vez constituida formalmente) o ante los tribunales de justicia competentes.
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
