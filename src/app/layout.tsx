import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Danbing AI - Master Chinese Characters 10x Faster",
  description: "Revolutionary dual-phase flash sessions based on 50+ years of memory research. Learn Traditional Chinese characters in just 90 seconds per session.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
