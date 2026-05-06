import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Visagismo · Consultoria de Imagem",
    short_name: "Visagismo",
    description: "Sistema de visagismo para barbeiros consultivos",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#17150F",
    orientation: "portrait-primary",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["productivity", "business"],
  };
}
