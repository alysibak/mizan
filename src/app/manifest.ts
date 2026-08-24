import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mizan: Islamic wealth, in balance",
    short_name: "Mizan",
    description: "Zakat, halal assets, and sadaqah. Local-first, with nothing that expires.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F7F4",
    theme_color: "#0E2A22",
    categories: ["finance"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
