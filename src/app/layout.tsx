import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import { GoogleTagManager } from '@next/third-parties/google';
import { Suspense } from 'react';
import "./globals.css";
import "./cursor-fix.css";
import { AlertProvider } from "@/hooks/useAlert";
import { AudioProvider } from "@/contexts/AudioContext";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Danbing AI - Master Chinese Characters 10x Faster",
  description: "Revolutionary dual-phase flash sessions based on 50+ years of memory research. Learn Traditional Chinese characters in just 90 seconds per session.",
  keywords: ["Chinese learning", "Traditional Chinese", "flash cards", "spaced repetition", "language learning", "Taiwan Mandarin"],
  authors: [{ name: "Danbing AI" }],
  creator: "Danbing AI",
  publisher: "Danbing AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Danbing AI - Master Chinese Characters 10x Faster",
    description: "Revolutionary dual-phase flash sessions based on 50+ years of memory research",
    url: "https://danbing.ai",
    siteName: "Danbing AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://static.danbing.ai/danbing_medium.png",
        width: 1200,
        height: 630,
        alt: "Danbing AI - Learn Chinese Characters with Science",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Danbing AI - Master Chinese Characters 10x Faster",
    description: "Revolutionary dual-phase flash sessions based on 50+ years of memory research",
    creator: "@danbingai",
    images: ["https://static.danbing.ai/danbing_medium.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7cc48" },
    { media: "(prefers-color-scheme: dark)", color: "#f7cc48" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      {measurementId && <GoogleTagManager gtmId={measurementId} />}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased`}
      >
        <NextTopLoader
          color="#f7cc48"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #f7cc48,0 0 5px #f7cc48"
        />
        <Providers>
          <AudioProvider>
            <AlertProvider>
              {children}
            </AlertProvider>
          </AudioProvider>
        </Providers>
        {measurementId && (
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
        )}
      </body>
    </html>
  );
}
