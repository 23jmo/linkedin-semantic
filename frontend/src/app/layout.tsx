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
    <html lang="en" suppressHydrationWarning data-oid="mjq658i">
      <body
        className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}
        data-oid="nb:vn_q"
      >
        <AuthProvider data-oid="h-_7jh-">
          <ThemeProvider data-oid="g84r6zc">
            <ProfileRedirect data-oid="vwy_j87">{children}</ProfileRedirect>
            <Toaster data-oid="6y:9ju0" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
