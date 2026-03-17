import type { Metadata, Viewport } from "next";
import { Poppins, Reddit_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import AppShell from "@/components/AppShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
  preload: true,
});

const redditSans = Reddit_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-reddit",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Rankeao.cl" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rankeao.cl | El ranking mas rankeao de Chile",
    description:
      "Compite en torneos, sube en rankings y conecta con tiendas y jugadores de todo Chile.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://api.rankeao.cl" />
        <link rel="preconnect" href="https://api.rankeao.cl" crossOrigin="anonymous" />
      </head>
      <body
        className={`${poppins.variable} ${redditSans.variable} antialiased min-h-screen flex flex-col`}
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

