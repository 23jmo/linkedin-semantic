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
    <div className="py-8 relative z-50" data-oid="f6oy3ni">
      <div className="max-w-3xl mx-auto" data-oid="ny2xip8">
        <h1
          className={`text-3xl font-bold mb-8 pt-16 pb-8 text-center ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
          data-oid="-uminon"
        >
          Search{" "}
          <span
            className={`${
              resolvedTheme === "light"
                ? "text-blue-900 bg-blue-500/30 px-2 rounded"
                : "text-blue-100 bg-blue-500/30 px-2 rounded"
            }`}
            data-oid="1ym.i:j"
          >
            {isLoading ? "0" : count.toLocaleString()}
          </span>{" "}
          Profiles
        </h1>
        <div className="mb-8 w-full" data-oid="mmurxz-">
          <SearchBox onSearch={onSearch} data-oid="_2op_kk" />
        </div>

        {isAuthenticated ? (
          <>
            <div className="mt-8" data-oid="h5aonet">
              <div className="relative" data-oid="wuhzsoy">
                <div
                  className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                  style={{
                    background:
                      resolvedTheme === "light"
                        ? "linear-gradient(to right, var(--background) 0%, transparent 100%)"
                        : "linear-gradient(to right, var(--background) 0%, transparent 100%)",
                  }}
                  data-oid="fdt5jp9"
                ></div>

                <div
                  ref={scrollRef}
                  className="flex overflow-x-auto pb-4 gap-2 no-scrollbar relative w-full "
                  data-oid="m2x0.jm"
                >
                  {suggestions.map((suggestion, index) => (
                    <SuggestionBox
                      key={index}
                      suggestion={suggestion}
                      onClick={onSearch}
                      data-oid="3magn7u"
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
                  data-oid="0qfpjy7"
                ></div>
              </div>
            </div>
          </>
        ) : (
          <AuthPrompt data-oid="gt4h-7." />
        )}
      </div>
    </div>
  );
}
