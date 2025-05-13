"use client";

import { useState, useRef, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme } = useTheme();

  const [isPointerDown, setIsPointerDown] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (query.trim()) {
        setIsPointerDown(true);
        handleSearch();
        setTimeout(() => {
          setIsPointerDown(false);
        }, 200);
      }
    }
  };

  const handlePointerDown = () => {
    setIsPointerDown(true);
  };

  const handlePointerUp = () => {
    setIsPointerDown(false);
  };

  const isQueryEmpty = query.trim() === "";

  return (
    <div className="w-full flex items-start space-x-2" data-oid="ou_8wc0">
      <form
        onSubmit={handleSearch}
        className="relative flex-grow"
        data-oid="6_a9wdn"
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search your network with natural language"
          rows={1}
          className={`w-full py-4 px-5 text-base rounded-lg focus:outline-none resize-none overflow-auto leading-tight ${
            resolvedTheme === "light"
              ? `bg-white text-gray-800`
              : `bg-gray-800 text-gray-200`
          }`}
          style={{ height: "auto", minHeight: "58px", maxHeight: "240px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
          }}
          data-oid="tvz0dlx"
        />
      </form>
      <button
        type="button"
        onClick={handleSearch}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        disabled={isQueryEmpty}
        className={`p-4 rounded-lg flex items-center justify-center transition-colors mt-1 ${
          isQueryEmpty
            ? resolvedTheme === "light"
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
            : resolvedTheme === "light"
              ? isPointerDown
                ? "bg-blue-300 text-white" // Highlight when pointer down (light mode)
                : "bg-blue-500 hover:bg-blue-600 text-white"
              : isPointerDown
                ? "bg-blue-500 text-white" // Highlight when pointer down (dark mode)
                : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        aria-label="Submit search"
        data-oid="e03hl2s"
      >
        <FaArrowUp className="w-5 h-5" data-oid="v1rec3m" />
      </button>
    </div>
  );
}
