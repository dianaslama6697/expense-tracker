import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Expense Tracker",
    short_name: "Expenses",
    description: "Track your expenses with ease",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f4f7",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
