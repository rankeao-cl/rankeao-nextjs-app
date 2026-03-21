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
    icons: [
      { src: "/rankeao-logo.png", sizes: "192x192", type: "image/png" },
      { src: "/rankeao-logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
