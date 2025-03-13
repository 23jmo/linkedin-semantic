"use client";

import { useRouter } from "next/navigation";

interface SuggestionBoxProps {
  title: string;
  items: string[];
}

export default function SuggestionBox({ title, items }: SuggestionBoxProps) {
  const router = useRouter();

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => handleSuggestionClick(item)}
              className="text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
