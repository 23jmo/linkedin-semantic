"use client";

import Header from "./Header";
import { useTheme } from "@/lib/theme-context";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Use the theme hook to be aware of theme changes
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Header />
      <main
        className={`mx-auto py-6 ${
          resolvedTheme === "light" ? "text-gray-900" : "text-gray-100"
        }`}
      >
        {children}
      </main>
    </>
  );
}
