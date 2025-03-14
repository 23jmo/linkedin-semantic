"use client";

import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

interface SuggestionBoxProps {
  title: string;
  items: string[];
}

export default function SuggestionBox({ title, items }: SuggestionBoxProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="mb-8">
      <h2
        className={`text-lg font-semibold ${
          resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
        } mb-4`}
      >
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(item)}
            className={`${
              resolvedTheme === "light"
                ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            } px-4 py-2 rounded-full border transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
