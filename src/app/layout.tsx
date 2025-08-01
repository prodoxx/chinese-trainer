import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import "./cursor-fix.css";
import { AlertProvider } from "@/hooks/useAlert";
import { Providers } from "./providers";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Danbing AI - Master Chinese Characters 10x Faster",
    description: "Revolutionary dual-phase flash sessions based on 50+ years of memory research",
    creator: "@danbingai",
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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased`}
      >
        <Providers>
          <AlertProvider>
            {children}
          </AlertProvider>
        </Providers>
      </body>
    </html>
  );
}
