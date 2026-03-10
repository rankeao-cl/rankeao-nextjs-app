import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rankeao.cl"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  title: {
    default: "Rankeao.cl | El ranking mas rankeao de Chile",
    template: "%s | Rankeao.cl",
  },
  description:
    "Torneos TCG, rankings en vivo, marketplace y comunidad local para Pokemon, Magic y Yu-Gi-Oh! en Chile.",
  keywords: ["TCG", "torneos", "cartas", "ranking", "marketplace", "Chile", "Magic", "Pokemon", "Yu-Gi-Oh"],
  openGraph: {
    title: "Rankeao.cl | El ranking mas rankeao de Chile",
    description:
      "Compite en torneos, sube en rankings y conecta con tiendas y jugadores de todo Chile.",
    type: "website",
    locale: "es_CL",
    siteName: "Rankeao.cl",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" data-theme="dark">
      <body
        className={`${inter.variable} ${rajdhani.variable} antialiased min-h-screen flex flex-col`}
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <Providers>
          <Navbar />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

