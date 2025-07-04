"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";

const suggestions = [
  {
    category: "Skills",
    queries: [
      "Machine Learning",
      "React Development",
      "Project Management",
      "Data Analysis",
      "UX Design",
    ],
  },
  {
    category: "Industries",
    queries: [
      "Software Engineering",
      "Finance",
      "Healthcare",
      "Marketing",
      "Education",
    ],
  },
  {
    category: "Roles",
    queries: [
      "Software Engineer",
      "Product Manager",
      "Data Scientist",
      "Marketing Specialist",
      "UX Designer",
    ],
  },
];

export default function SearchSuggestions() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const handleSuggestionClick = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <h2
        className={`text-xl font-semibold mb-4 ${
          resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
        }`}
      >
        Try searching for:
      </h2>
      <div className="space-y-6">
        {suggestions.map((group) => (
          <div key={group.category}>
            <h3
              className={`text-md font-medium mb-2 ${
                resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {group.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.queries.map((query) => (
                <button
                  key={query}
                  onClick={() => handleSuggestionClick(query)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    resolvedTheme === "light"
                      ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  }`}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
