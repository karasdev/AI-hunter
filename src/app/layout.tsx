import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { auth } from "@/auth";
import { Providers } from "@/components/providers";

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
  title: "AI Hunter — job match for your resume",
  description: "Match your PDF resume to jobs from public listings (Remotive, Arbeitnow) with AI or keyword scoring.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
