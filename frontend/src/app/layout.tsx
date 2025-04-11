import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import AuthProvider from "../components/AuthProvider";
import ProfileRedirect from "../components/ProfileRedirect";
import { ToastWrapper } from "@/components/providers/ToastWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Locked IN",
  description: "Search your LinkedIn network using semantic search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}
      >
        <AuthProvider>
          <ThemeProvider>
            <ToastWrapper>
              <ProfileRedirect>{children}</ProfileRedirect>
            </ToastWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
