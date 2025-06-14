"use client";

import { useTheme } from "@/lib/theme-context";

interface SuggestionBoxProps {
  suggestion: string;
  onClick: (suggestion: string) => void;
}

export default function SuggestionBox({
  suggestion,
  onClick,
}: SuggestionBoxProps) {
  const { resolvedTheme } = useTheme();

  return (
    <button
      onClick={() => {
        console.log("SuggestionBox clicked:", suggestion);
        onClick(suggestion);
      }}
      className={`${
        resolvedTheme === "light"
          ? "bg-white text-gray-700 hover:bg-gray-50"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      } px-4 py-2 rounded-full border-2 border-blue-400 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow whitespace-nowrap ${
        resolvedTheme === "light"
          ? "bg-gradient-to-r from-blue-100 to-blue-50"
          : "bg-gradient-to-r from-blue-900/20 to-blue-800/20"
      } relative overflow-hidden hover:-translate-y-1 hover:shadow-md flex-shrink-0`}
    >
      <span className="relative z-10">{suggestion}</span>
      <span
        className={`absolute inset-0 bg-gradient-to-r ${
          resolvedTheme === "light"
            ? "from-transparent via-white/40 to-transparent"
            : "from-transparent via-gray-600/30 to-transparent"
        } -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out shine-effect pointer-events-none`}
      ></span>
    </button>
  );
}
