import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

const headingFont = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karting Madness League Tracker",
  description: "League standings, rounds, and race result tracking for karting competitions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <div className="page-theme-toggle">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
