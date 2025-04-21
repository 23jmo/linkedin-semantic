"use client";

import { useState, useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

interface SearchBoxProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export default function SearchBox({
  initialQuery = "",
  onSearch,
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  // const clearSearch = () => {
  //   setQuery("");
  //   if (inputRef.current) {
  //     inputRef.current.focus();
  //   }
  // };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSearch}
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
          className={`w-full py-4 px-12 text-lg rounded-xl shadow-sm transition-all duration-200 ease-in-out focus:outline-none ${
            resolvedTheme === "light"
              ? `bg-white text-gray-800 border-gray-200 ${
                  isFocused
                    ? "ring-2 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    : ""
                }`
              : `bg-gray-800 text-gray-200 border-gray-700 ${
                  isFocused
                    ? "ring-2 ring-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    : ""
                }`
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
