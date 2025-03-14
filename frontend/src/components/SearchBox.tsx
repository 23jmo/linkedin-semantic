"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

interface SearchBoxProps {
  initialQuery?: string;
}

export default function SearchBox({ initialQuery = "" }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearSearch = () => {
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="relative"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search your network with natural language"
          className={`w-full py-4 px-12 text-lg rounded-xl shadow-sm focus:outline-none focus:ring-2 ${
            resolvedTheme === "light"
              ? "bg-white text-gray-800 focus:ring-blue-400 border-gray-200"
              : "bg-gray-800 text-gray-200 focus:ring-blue-600 border-gray-700"
          } border`}
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
          <FaSearch
            className={
              resolvedTheme === "light" ? "text-gray-400" : "text-gray-500"
            }
          />
        </div>
        <button
          type="submit"
          className={`absolute inset-y-0 right-0 px-6 flex items-center ${
            resolvedTheme === "light"
              ? "text-blue-600 hover:text-blue-800"
              : "text-blue-400 hover:text-blue-300"
          } font-medium transition-colors`}
        >
          Search
        </button>
      </form>
    </div>
  );
}
