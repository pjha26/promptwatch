import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Promptwatch | AI Visibility Intelligence",
  description: "Track AI crawler traffic and brand visibility across ChatGPT, Claude, and Perplexity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${dmSans.variable} ${barlowCondensed.variable} ${dmMono.variable} bg-surface-container-lowest text-primary min-h-screen antialiased selection:bg-primary selection:text-on-primary`}>
        {children}
      </body>
    </html>
  );
}
