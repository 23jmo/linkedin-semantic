"use client";

import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

export default function ThemeToggle() {
  const { theme, resolvedTheme, cycleTheme, mounted } = useTheme();

  if (!mounted) {
    // Prevent layout shift
    return <div className="w-10 h-10" data-oid="x3ku_o2" />;
  }

  return (
    <button
      onClick={cycleTheme}
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        resolvedTheme === "light"
          ? "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
          : "bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
      } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077b5] ${
        resolvedTheme === "dark" ? "focus:ring-offset-gray-900" : ""
      } border`}
      aria-label={`Switch to ${
        theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
      } mode`}
      title={`Current theme: ${theme}`}
      data-oid="cohv-v."
    >
      {theme === "light" && (
        <FaSun className="text-yellow-500" size={18} data-oid="1m:66:8" />
      )}
      {theme === "dark" && (
        <FaMoon className="text-blue-400" size={18} data-oid="62hclub" />
      )}
      {theme === "system" && (
        <FaDesktop
          className={
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          }
          size={18}
          data-oid="xuxutxy"
        />
      )}
    </button>
  );
}
