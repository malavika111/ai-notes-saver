import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PageTransition } from "@/components/ui/PageTransition";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Notebook AI",
  description: "A startup-grade AI powered notes workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/20`}
      >
        <PageTransition>
          {children}
        </PageTransition>
        <Toaster />
      </body>
    </html>
  );
}
