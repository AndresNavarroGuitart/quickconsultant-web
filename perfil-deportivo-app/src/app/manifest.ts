import type { MetadataRoute } from "next";

// Habilita "Instalar app" / "Agregar a inicio" en Android y PC (Chrome,
// Edge). En iOS Safari, Agregar a inicio se apoya en apple-icon.tsx + el
// appleWebApp de layout.tsx, no en este manifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Potrero Deportivo",
    short_name: "Potrero",
    description:
      "Llevá el registro de tus clubes, partidos y estadísticas, y compartí tu perfil deportivo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1568b8",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
