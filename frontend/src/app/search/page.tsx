"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchLimits } from "@/hooks/useSearchLimits";
import Layout from "@/components/Layout";
import UnauthenticatedSearchWarning from "@/components/UnauthenticatedSearchWarning";
import SelectionChip from "@/components/SelectionChip";
import EmailComposer from "@/components/EmailComposer";
import LoadingIndicator from "@/components/LoadingIndicator";
import ThinkingProcess, { ThinkingStep } from "@/components/ThinkingProcess";
import SearchControls from "@/components/SearchControls";
import SearchResults from "@/components/SearchResults";
import { ProfileFrontend } from "../../types/types";
import { SearchResult } from "../../types/types";

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get quota management functions and state
  const {
    incrementUsage,
    error: quotaError,
    quota,
    isLoading: quotaLoading,
  } = useSearchLimits();

  // State for selected profiles
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileFrontend[]>(
    []
  );
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  // Thinking step states
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setError(null);
      setResults([]);
      setThinkingSteps([]);

      // --- Increment Usage and Check Limit ---
      let canSearch = false;
      try {
        canSearch = await incrementUsage();
      } catch (incError) {
        // Error during increment call itself (network etc.)
        console.error("Error calling incrementUsage:", incError);
        setError(
          `Failed to check search quota: ${
            incError instanceof Error ? incError.message : String(incError)
          }`
        );
        setLoading(false);
        return;
      }

      if (!canSearch) {
        // --- Handle quota limit error more gracefully ---
        let displayError =
          quotaError ||
          "Search limit reached or quota could not be updated. Please check your usage.";
        // Check if the error is specifically about the limit
        if (quotaError && /limit reached/i.test(quotaError)) {
          displayError =
            "You have reached your monthly search limit. Please upgrade or wait until the quota resets.";
        }
        setError(displayError);
        // --- End graceful handling ---
        setLoading(false);
        return;
      }
      // --- End Increment Usage Check ---

      // --- Proceed with Search Fetch ---
      try {
        const controller = new AbortController();
        const signal = controller.signal;

        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
          }),
          signal,
        });

        if (!response.ok) {
          // Handle errors specifically from the search API
          let errorMsg = `Search failed: ${response.status} ${response.statusText}`;
          try {
            const errData = await response.json();
            if (errData.error) {
              errorMsg = `Search failed: ${errData.error}`;
            }
          } catch (e) {
            // Ignore if response body isn't JSON
          }
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get stream reader");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            const event = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            switch (event) {
              case "step":
                if (data.name && data.status) {
                  setThinkingSteps((prev) => {
                    const existingIndex = prev.findIndex(
                      (step) => step.name === data.name
                    );
                    if (existingIndex >= 0) {
                      const newSteps = [...prev];
                      newSteps[existingIndex] = data;
                      return newSteps;
                    } else {
                      return [...prev, data];
                    }
                  });
                }
                break;
              case "results":
                setResults(data);
                break;
              case "error":
                setError(data.message); // Error from the backend search stream
                break;
              case "done":
                setLoading(false);
                break;
            }
          }
        }
        // If the loop finished without setting loading to false (no 'done' event)
        if (loading) setLoading(false);
      } catch (err) {
        console.error("Search fetch error:", err);
        // Set error state only if it hasn't been set by the stream
        if (!error) {
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred during the search."
          );
        }
        setLoading(false);
      }
    },
    [incrementUsage]
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      if (status === "authenticated") {
        // Don't automatically search on load if quota is potentially an issue
        // Let user initiate via button or re-search
        // performSearch(q); // Consider removing auto-search on load
        performSearch(q);
      } else {
        setError(null); // Clear errors if user logs out/in
        setResults([]);
        setThinkingSteps([]);
      }
    }
  }, [searchParams, status, performSearch]);

  // Handle profile selection
  const handleProfileSelect = (profile: ProfileFrontend, selected: boolean) => {
    if (selected) {
      // Check if we already have 3 profiles selected
      if (selectedProfiles.length >= 3) {
        alert("You can only select up to 3 profiles for cold emailing.");
        return;
      }
      setSelectedProfiles((prev) => [...prev, profile]);
    } else {
      setSelectedProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    }
  };

  // Handle removing a profile from selection
  const handleRemoveProfile = (profileId: string) => {
    setSelectedProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  // Toggle email composer
  const toggleEmailComposer = () => {
    setShowEmailComposer((prev) => !prev);
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Search Results</h1>

          <SearchControls
            initialQuery={query}
            onSearch={performSearch}
          />
          {/* --- Add Quota Indicator --- */}
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-4 pr-1">
            {quotaLoading ? (
              <span>Loading quota...</span>
            ) : quota ? (
              <span>
                Searches used: {quota.searches_this_month} /
                {quota.monthly_search_limit}
              </span>
            ) : (
              <span>Quota N/A</span>
            )}
          </div>
          {/* --- End Quota Indicator --- */}

          {status === "unauthenticated" ? (
            <UnauthenticatedSearchWarning />
          ) : (
            <>
              {/* Show thinking steps when available */}
              {thinkingSteps.length > 0 && (
                <ThinkingProcess thinkingSteps={thinkingSteps} />
              )}

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              ) : (
                <SearchResults
                  results={results}
                  query={query}
                  selectedProfiles={selectedProfiles}
                  onProfileSelect={handleProfileSelect}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Selection chip */}
      <SelectionChip
        count={selectedProfiles.length}
        onClick={toggleEmailComposer}
      />

      {/* Email composer modal */}
      {showEmailComposer && (
        <EmailComposer
          selectedProfiles={selectedProfiles}
          onClose={toggleEmailComposer}
          onRemoveProfile={handleRemoveProfile}
        />
      )}
    </Layout>
  );
}
