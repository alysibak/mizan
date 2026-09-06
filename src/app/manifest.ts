import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mizan: Islamic wealth, in balance",
    short_name: "Mizan",
    description:
      "Reckon zakat against nisab, keep a ledger, and close the holding year.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F3F5F1",
    theme_color: "#0E2A22",
    categories: ["finance"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Balance",
        short_name: "Balance",
        url: "/dashboard",
      },
      {
        name: "The year",
        short_name: "Year",
        url: "/year",
      },
      {
        name: "Record giving",
        short_name: "Give",
        url: "/giving",
      },
    ],
  };
}
