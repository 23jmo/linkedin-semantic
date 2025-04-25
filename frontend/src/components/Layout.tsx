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
    <div className={resolvedTheme === "dark" ? "dark" : ""} data-oid="k_r27ao">
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900"
        data-oid="rqh6j46"
      >
        <Header data-oid="_pk3wj5" />
        <main
          className={`mx-auto py-3 md:py-12 ${
            resolvedTheme === "light" ? "text-gray-900" : "text-gray-100"
          }`}
          data-oid="uwpghcd"
        >
          {children}
        </main>
        <ReferralPopup data-oid="jc1vhhj" />
      </div>
    </div>
  );
}
