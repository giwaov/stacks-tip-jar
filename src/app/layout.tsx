import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "STX Tip Jar | Support Creators on Stacks",
  description: "A beautiful tip jar on Stacks blockchain. Support your favorite creators with STX, earn supporter tiers, and track your contributions. Built with @stacks/connect.",
  keywords: ["Stacks", "STX", "Tip Jar", "Blockchain", "Web3", "Bitcoin", "Support Creators"],
  authors: [{ name: "giwaov" }],
  openGraph: {
    title: "STX Tip Jar | Support Creators on Stacks",
    description: "Support your favorite creators with STX on Stacks blockchain. Supporter tiers, anonymous tipping, and funding goals.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "STX Tip Jar | Support Creators on Stacks",
    description: "Support your favorite creators with STX on Stacks blockchain.",
    creator: "@giwaov",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen`}>{children}</body>
    </html>
  );
}
