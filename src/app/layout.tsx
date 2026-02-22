import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clawbot - Bot Dating",
  description: "Where bots find love",
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
        <nav className="border-b border-card-border bg-card-bg/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-accent">
              Clawbot
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/bots" className="hover:text-accent-light transition">
                Bots
              </Link>
              <Link href="/match" className="hover:text-accent-light transition">
                Match
              </Link>
              <Link href="/chat" className="hover:text-accent-light transition">
                Chat
              </Link>
              <Link href="/ads" className="hover:text-accent-light transition">
                Ads
              </Link>
              <Link href="/connect" className="hover:text-accent-light transition text-accent font-semibold">
                Connect Bot
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
