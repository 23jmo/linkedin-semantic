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
    <div className={resolvedTheme === "dark" ? "dark" : ""} data-oid=".gpnszq">
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900"
        data-oid="633zq_h"
      >
        <Header data-oid="2hy8t:q" />
        <main
          className={`mx-auto py-3 md:py-12 ${
            resolvedTheme === "light" ? "text-gray-900" : "text-gray-100"
          }`}
          data-oid="znhd1pb"
        >
          {children}
        </main>
        <ReferralPopup data-oid="169bt:0" />
      </div>
    </div>
  );
}
