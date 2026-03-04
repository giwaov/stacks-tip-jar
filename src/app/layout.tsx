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
  other: {
    "talentapp:project_verification": "b6300f90e937cc3799b7decc1392ba16aaf00581b3775472f383f9ea3014b0abe9bd430bbb995b9b6d6e95c766455e2486c80615594344597927fec341a6",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen`}>{children}</body>
    </html>
  );
}
