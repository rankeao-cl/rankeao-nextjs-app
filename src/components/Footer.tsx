import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/react";

const footerLinks = [
  {
    title: "SECCIONES",
    links: [
      { label: "Torneos Activos", href: "/torneos" },
      { label: "Rankings Globales", href: "/ranking" },
      { label: "Mercado", href: "/marketplace" },
      { label: "Tiendas Locales", href: "/comunidades" },
    ],
  },
  {
    title: "COMUNIDAD",
    links: [
      { label: "Discord", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "WhatsApp Community", href: "#" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-purple-900/30 bg-black/70 mt-16">
      <div className="rk-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-purple-500/40 shadow-[0_0_16px_rgba(124,58,237,0.4)] bg-black/40">
                <Image
                  src="/logo.png"
                  alt="Rankeao logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-2xl text-white">Rankeao.cl</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
              El ranking mas rankeao de Chile. Torneos TCG, metricas en vivo y tu comunidad
              local favorita para Pokemon, Magic y Yu-Gi-Oh!.
            </p>
            <div className="mt-5">
              <Link href="/torneos">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-red-500 text-white font-semibold">
                  Crear Torneo
                </Button>
              </Link>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-gray-200 mb-3 text-xs uppercase tracking-[0.15em]">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-cyan-300 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-purple-900/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Rankeao.cl - Hecho en Chile con pasion TCG
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/terminos">Terminos</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
