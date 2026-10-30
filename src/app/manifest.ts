import type { MetadataRoute } from "next";

// Installable app on phones. "Share → TrustLens" from WhatsApp, SMS or any browser opens /share with the link, text or QR image.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrustLens: check before you trust",
    short_name: "TrustLens",
    description: "Check links, messages, QR codes and files for scams before you tap.",
    id: "/",
    start_url: "/share",
    scope: "/",
    display: "standalone",
    background_color: "#07090a",
    theme_color: "#07090a",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: { title: "title", text: "text", url: "url", files: [{ name: "image", accept: ["image/*"] }] },
    },
  } as MetadataRoute.Manifest;
}
