"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";

interface SearchBoxProps {
  initialQuery?: string;
}

export default function SearchBox({ initialQuery = "" }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for people by skills, experience, or company..."
          className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
        >
          <FaSearch size={20} />
        </button>
      </div>
    </form>
  );
}
