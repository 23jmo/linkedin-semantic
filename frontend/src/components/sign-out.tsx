"use client";

import { FaSignOutAlt } from "react-icons/fa";
import { signOut } from "next-auth/react";
import { useTheme } from "@/lib/theme-context";

/**
 * @param className - Additional classes for positioning/spacing the button
 */
export default function SignIn({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignOut}
      className={`${
        className || ""
      } flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-white ${
        resolvedTheme === "light"
          ? "bg-[#ee3649] hover:bg-[#ee3649]"
          : "bg-[#ee3649]/90 hover:bg-[#ee3649]"
      } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ee3649] ${
        resolvedTheme === "light"
          ? "focus:ring-offset-white"
          : "focus:ring-offset-gray-800"
      }`}
      data-oid="9.cnlji"
    >
      <FaSignOutAlt className="h-5 w-5" data-oid="mh2sv64" />
      <span data-oid="ii--dgo">Sign out</span>
    </button>
  );
}
