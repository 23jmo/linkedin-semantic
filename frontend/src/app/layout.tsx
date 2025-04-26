import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import AuthProvider from "../components/AuthProvider";
import ProfileRedirect from "../components/ProfileRedirect";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Locked IN",
  description: "Search your LinkedIn network using semantic search",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-oid="wkixay8">
      <body
        className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}
        data-oid="ztm:3nz"
      >
        <AuthProvider data-oid="g.3qr0o">
          <ThemeProvider data-oid="8pctlma">
            <ProfileRedirect data-oid="vt3:p8.">{children}</ProfileRedirect>
            <Toaster data-oid="geofv0s" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
