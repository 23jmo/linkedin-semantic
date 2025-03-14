"use client";

import { useTheme } from "@/lib/theme-context";
import { useEffect, useRef } from "react";
import SearchBox from "@/components/SearchBox";
import SuggestionBox from "@/components/SuggestionBox";
import AuthPrompt from "@/components/AuthPrompt";

interface HomeContentProps {
  isAuthenticated: boolean;
  suggestions: string[];
}

export default function HomeContent({
  isAuthenticated,
  suggestions,
}: HomeContentProps) {
  const { resolvedTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || !isAuthenticated) return;

    const scrollContainer = scrollRef.current;
    let scrollAmount = 0;
    const scrollSpeed = 0.2; // Slower scroll speed
    let isPaused = false;

    const scroll = () => {
      if (!isPaused) {
        scrollAmount += scrollSpeed;
        if (
          scrollAmount >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollAmount = 0;
        }
        scrollContainer.scrollLeft = scrollAmount;
      }
      requestAnimationFrame(scroll);
    };

    scrollContainer.addEventListener("mouseenter", () => {
      isPaused = true;
    });
    scrollContainer.addEventListener("mouseleave", () => {
      isPaused = false;
    });

    requestAnimationFrame(scroll);

    return () => {
      scrollContainer.removeEventListener("mouseenter", () => {
        isPaused = true;
      });
      scrollContainer.removeEventListener("mouseleave", () => {
        isPaused = false;
      });
    };
  }, [isAuthenticated]);

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto">
        <h1
          className={`text-3xl font-bold mb-8 pt-16 pb-8 text-center ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
        >
          Search Your LinkedIn Network
        </h1>
        <div className="mb-8">
          <SearchBox />
        </div>

        {isAuthenticated ? (
          <div className="mt-8">
            <div className="relative">
              <div
                className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                style={{
                  background:
                    resolvedTheme === "light"
                      ? "linear-gradient(to right, var(--background) 0%, transparent 100%)"
                      : "linear-gradient(to right, var(--background) 0%, transparent 100%)",
                }}
              ></div>

              <div
                ref={scrollRef}
                className="flex overflow-x-auto pb-4 gap-2 no-scrollbar relative w-full"
              >
                {suggestions.map((suggestion, index) => (
                  <SuggestionBox
                    key={index}
                    suggestion={suggestion}
                  />
                ))}
              </div>

              <div
                className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                style={{
                  background:
                    resolvedTheme === "light"
                      ? "linear-gradient(to left, var(--background) 0%, transparent 100%)"
                      : "linear-gradient(to left, var(--background) 0%, transparent 100%)",
                }}
              ></div>
            </div>
          </div>
        ) : (
          <AuthPrompt />
        )}
      </div>
    </div>
  );
}
