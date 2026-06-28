import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

/* ─── Metadata ──────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'AtlasRPA',
  description: 'Enterprise RPA telemetry and control dashboard.',
  keywords: [
    'AtlasRPA',
    'RPA Control Terminal',
  ],
  authors: [{ name: 'AtlasRPA Systems' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  themeColor: '#080C14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/* ─── Root Layout ───────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* ── Google Fonts: JetBrains Mono (terminal) + Inter (UI) ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="scanline-overlay">
        {/* ── Load hackathon-provided data engine BEFORE React hydrates ── */}
        <Script src="/dataStream.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
