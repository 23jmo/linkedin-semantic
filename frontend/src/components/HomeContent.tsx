"use client";

import { useTheme } from "@/lib/theme-context";
import { useEffect, useRef } from "react";
import SearchBox from "@/components/SearchBox";
import SuggestionBox from "@/components/SuggestionBox";
import AuthPrompt from "@/components/AuthPrompt";
import { useProfileCount } from "@/hooks/useProfileCount";

interface HomeContentProps {
  isAuthenticated: boolean;
  suggestions: string[];
  onSearch: (query: string) => void;
}

export default function HomeContent({
  isAuthenticated,
  suggestions,
  onSearch,
}: HomeContentProps) {
  const { resolvedTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { count, isLoading } = useProfileCount();

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
    <div className="relative z-50 h-[470px]" data-oid="1g7t3z8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6" data-oid="qf2l.k3">
        <h1
          className={`text-2xl md:text-3xl font-bold mb-10 pt-16 pb-8 text-center ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
          data-oid="0_jjjs8"
        >
          Search{" "}
          <span
            className={`${
              resolvedTheme === "light"
                ? "text-blue-900 bg-blue-500/30 px-2 rounded"
                : "text-blue-100 bg-blue-500/30 px-2 rounded"
            }`}
            data-oid="psoiaad"
          >
            {isLoading ? "0" : count.toLocaleString()}
          </span>{" "}
          Profiles
        </h1>
        <div className="mb-12 w-full" data-oid="98s.fdh">
          <SearchBox onSearch={onSearch} data-oid="_2h3zuk" />
        </div>

        {isAuthenticated ? (
          <>
            <div className="mt-10 mb-6" data-oid="-ucb2hc">
              <div className="relative mx-2" data-oid="zd_3i11">
                <div
                  className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                  style={{
                    background:
                      resolvedTheme === "light"
                        ? "linear-gradient(to right, var(--background) 0%, transparent 100%)"
                        : "linear-gradient(to right, var(--background) 0%, transparent 100%)",
                  }}
                  data-oid="o359z1a"
                ></div>

                <div
                  ref={scrollRef}
                  className="flex overflow-x-auto py-2 pb-6 gap-3 no-scrollbar relative w-full"
                  data-oid="o-a5ul5"
                >
                  {suggestions.map((suggestion, index) => (
                    <SuggestionBox
                      key={index}
                      suggestion={suggestion}
                      onClick={onSearch}
                      data-oid="iwf.kt5"
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
                  data-oid="aut_bnl"
                ></div>
              </div>
            </div>
          </>
        ) : (
          <AuthPrompt data-oid="_vo4_80" />
        )}
      </div>
    </div>
  );
}
