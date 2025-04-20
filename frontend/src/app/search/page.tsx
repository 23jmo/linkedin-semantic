"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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

  // State for selected profiles
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileFrontend[]>(
    []
  );
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  // Thinking step states
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setThinkingSteps([]);

    try {
      // Create a new AbortController for this search
      const controller = new AbortController();
      const signal = controller.signal;

      // Make the fetch request with streaming
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create a reader from the response body stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get stream reader");
      }

      // Create a TextDecoder to decode the chunks
      const decoder = new TextDecoder();
      let buffer = "";

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and add it to the buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete events from the buffer
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep the last incomplete chunk in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse the event and data
          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          // Process the event
          switch (event) {
            case "step":
              if (data.name && data.status) {
                setThinkingSteps((prev) => {
                  // Check if this step already exists
                  const existingIndex = prev.findIndex(
                    (step) => step.name === data.name
                  );

                  if (existingIndex >= 0) {
                    // Update existing step
                    const newSteps = [...prev];
                    newSteps[existingIndex] = data;
                    return newSteps;
                  } else {
                    // Add new step
                    return [...prev, data];
                  }
                });
              }
              break;
            case "results":
              setResults(data);
              break;
            case "error":
              setError(data.message);
              break;
            case "done":
              setLoading(false);
              break;
          }
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      if (status === "authenticated") {
        performSearch(q);
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

          <SearchControls initialQuery={query} />

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
