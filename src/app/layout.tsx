import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./tw-generated.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "HireLens AI — AI-powered resume screening & matching",
    template: "%s · HireLens AI",
  },
  description:
    "AI-powered resume screening, matching & hiring intelligence. Deterministic, explainable candidate scores with AI-generated insights — recruiters keep the final say.",
  keywords: ["resume screening", "candidate matching", "recruitment AI", "hiring intelligence", "ATS"],
  openGraph: {
    title: "HireLens AI",
    description: "AI-powered resume screening, matching & hiring intelligence.",
    type: "website",
  },
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
