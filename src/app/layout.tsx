import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./tw-generated.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f43f5e",
};

export const metadata: Metadata = {
  title: {
    default: "HireLens AI — AI-powered resume screening & matching",
    template: "%s · HireLens AI",
  },
  description:
    "AI-powered resume screening, matching & hiring intelligence. Deterministic, explainable candidate scores with AI-generated insights — recruiters keep the final say.",
  keywords: ["resume screening", "candidate matching", "recruitment AI", "hiring intelligence", "ATS", "recruiting software", "applicant tracking"],
  authors: [{ name: "HireLens AI" }],
  creator: "HireLens AI",
  publisher: "HireLens AI",
  metadataBase: new URL("https://hirelens-ai-black.vercel.app"),
  openGraph: {
    title: "HireLens AI — Screen resumes smarter",
    description: "AI-powered resume screening with deterministic scoring and explainable insights. Screen 100 resumes in minutes.",
    type: "website",
    url: "https://hirelens-ai-black.vercel.app",
    siteName: "HireLens AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HireLens AI — Resume screening platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireLens AI — Screen resumes smarter",
    description: "AI-powered resume screening with deterministic scoring and explainable insights.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
