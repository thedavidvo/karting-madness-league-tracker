import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import Link from "next/link";
import { logout } from "@/app/actions";
import ThemeToggle from "@/components/theme-toggle";
import { isAuthenticated } from "@/lib/auth";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();

  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`} data-theme="dark">
      <body>
        <div className="page-header-controls">
          {authenticated ? (
            <form action={logout}>
              <button type="submit" className="small-button">
                Sign Out
              </button>
            </form>
          ) : (
            <Link href="/login" className="small-button">
              Admin Sign In
            </Link>
          )}
          <ThemeToggle />
        </div>
        <div className="page-content">{children}</div>
        <footer className="page-signature">Created by Dvo</footer>
      </body>
    </html>
  );
}
