import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { segmentColorCss } from "@/lib/segments";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Witomni Customer Intelligence",
  description:
    "See who your customers are, who will buy again, and what to do next.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <style>{segmentColorCss()}</style>
      </head>
      <body className="min-h-full lg:flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6">
            {children}
          </main>
          <footer className="border-t border-border px-4 py-4 text-sm text-muted md:px-6">
            <Link href="/model" className="text-accent hover:underline">
              How accurate is this?
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
