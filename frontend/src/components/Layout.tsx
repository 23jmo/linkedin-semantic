"use client";

import Header from "./Header";
import { useTheme } from "@/lib/theme-context";
import ReferralPopup from "./ReferralPopup";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Use the theme hook to be aware of theme changes
  const { resolvedTheme } = useTheme();

  return (
    <div className={resolvedTheme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main
          className={`mx-auto py-6 ${
            resolvedTheme === "light" ? "text-gray-900" : "text-gray-100"
          }`}
        >
          {children}
        </main>
        <ReferralPopup />
      </div>
    </div>
  );
}
