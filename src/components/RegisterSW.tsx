"use client";
import { useEffect } from "react";

// Registers the share-target service worker so the site installs as an app on phones.
export function RegisterSW() {
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  return null;
}
