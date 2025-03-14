"use client";

import { useTheme } from "@/lib/theme-context";
import SearchBox from "@/components/SearchBox";
import SuggestionBox from "@/components/SuggestionBox";
import AuthPrompt from "@/components/AuthPrompt";

interface HomeContentProps {
  isAuthenticated: boolean;
  suggestions: {
    title: string;
    items: string[];
  }[];
}

export default function HomeContent({
  isAuthenticated,
  suggestions,
}: HomeContentProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto">
        <h1
          className={`text-3xl font-bold mb-6 text-center ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
        >
          Search Your LinkedIn Network
        </h1>
        <div className="mb-8">
          <SearchBox />
        </div>

        {isAuthenticated ? (
          <div className="space-y-8 mt-8">
            {suggestions.map((group, index) => (
              <SuggestionBox
                key={index}
                title={group.title}
                items={group.items}
              />
            ))}
          </div>
        ) : (
          <AuthPrompt />
        )}
      </div>
    </div>
  );
}
