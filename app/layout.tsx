import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

// Display face — variable serif, optically sized. Weights 400-700 cover
// eyebrow-to-hero; SOFT/WONK axes are tuned in globals.css. next/font only
// ships the weight axis unless the others are named, and italic is its own
// file — verses are set in it (`.verse`).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

// Body face
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1f5d4c",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SermonFlow — Scripture on screen, the moment it's spoken",
  description:
    "SermonFlow listens to your sermon and puts every verse on screen in real time — automatic Bible scripture detection, AI sermon notes, and WhatsApp summaries for your congregation.",
  keywords: ["sermon", "transcription", "bible", "scripture", "church", "worship"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    // Dark glyphs — every surface is parchment, so white status text would vanish.
    statusBarStyle: "default",
    title: "SermonFlow",
  },
  icons: {
    // /favicon.ico is injected automatically from the app/favicon.ico file convention.
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// The service worker (public/sw.js) is cache-first for /_next/static. Production
// chunk names are content-hashed, so that's safe; dev chunk names stay the same
// between edits, so there it would keep serving stale code. Register it in
// production only — and in development, remove a worker and caches left behind
// by an earlier run, or they'd carry on doing exactly that.
const SERVICE_WORKER_SCRIPT =
  process.env.NODE_ENV === "production"
    ? `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
    : `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations
                    .filter((r) => [r.active, r.waiting, r.installing].some((w) => w && w.scriptURL.endsWith('/sw.js')))
                    .forEach((r) => r.unregister());
                });
                if ('caches' in window) {
                  caches.keys().then((keys) => {
                    keys.filter((key) => key.startsWith('sermonflow-')).forEach((key) => caches.delete(key));
                  });
                }
              }
            `;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${manrope.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script dangerouslySetInnerHTML={{ __html: SERVICE_WORKER_SCRIPT }} />
      </body>
    </html>
  );
}
