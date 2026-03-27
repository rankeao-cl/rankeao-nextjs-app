import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rankeao.cl — El ranking mas rankeao de Chile",
    short_name: "Rankeao",
    description:
      "Torneos TCG, rankings en vivo, marketplace y comunidad para Pokemon, Magic y Yu-Gi-Oh! en Chile.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#3B82F6",
    orientation: "portrait",
    scope: "/",
    lang: "es-CL",
    categories: ["games", "social", "entertainment"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.png", sizes: "1024x1024", type: "image/png" },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Duelos",
        short_name: "Duelos",
        url: "/duelos",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Torneos",
        short_name: "Torneos",
        url: "/torneos",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Marketplace",
        short_name: "Mercado",
        url: "/marketplace",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
