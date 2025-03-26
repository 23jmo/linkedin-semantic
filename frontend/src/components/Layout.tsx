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
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
          resolvedTheme === "light" ? "text-gray-900" : "text-gray-100"
        }`}
      >
        {children}
      </main>
    </>
  );
}
