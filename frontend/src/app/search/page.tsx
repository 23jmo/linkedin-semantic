"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SearchBox from "@/components/SearchBox";
import ProfileCard from "@/components/ProfileCard";
import LoadingIndicator from "@/components/LoadingIndicator";
import Layout from "@/components/Layout";
import UnauthenticatedSearchWarning from "@/components/UnauthenticatedSearchWarning";
import SelectionChip from "@/components/SelectionChip";
import EmailComposer from "@/components/EmailComposer";
import { ProfileFrontend } from "../../types/types";
import { SearchResult } from "../../types/types";
import { semanticSearch } from "@/lib/api";

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <SearchPageContent />
    </Suspense>
  );
}

// Define types for thinking steps
interface ThinkingStep {
  name: string;
  status: "started" | "completed" | "error";
  data?: any;
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
  const [useHyde, setUseHyde] = useState<boolean>(true);

  // New state for thinking process
  const [showThinking, setShowThinking] = useState<boolean>(true);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
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
            useHyde,
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
    },
    [useHyde]
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      if (status === "authenticated") {
        performSearch(q);
      }
    }
  }, [searchParams, status, performSearch]);

  // Update useHyde state based on URL param
  useEffect(() => {
    const hydeParam = searchParams.get("useHyde");
    if (hydeParam !== null) {
      setUseHyde(hydeParam === "true");
    }
  }, [searchParams]);

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

  // Render the thinking steps
  const renderThinkingStep = (step: ThinkingStep) => {
    // Format different types of data appropriately
    const renderStepData = () => {
      if (!step.data) return null;

      switch (step.name) {
        case "relevant_sections":
          return step.data.map((section: string) => (
            <span
              key={section}
              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-2"
            >
              {section}
            </span>
          ));
        case "traits":
          return step.data.map((trait: string) => (
            <span
              key={trait}
              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2 mb-2"
            >
              {trait}
            </span>
          ));
        case "key_phrases":
          return step.data.map(
            (phrase: { key_phrase: string; relevant_section: string }) => (
              <div
                key={phrase.key_phrase}
                className="text-sm mb-1"
              >
                <span className="font-medium">{phrase.key_phrase}</span>
                <span className="text-gray-500 text-xs ml-1">
                  ({phrase.relevant_section})
                </span>
              </div>
            )
          );
        case "sql_query":
          return (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {step.data}
            </pre>
          );
        case "search_execution":
          return <div>Found {step.data.count} results</div>;
        default:
          return JSON.stringify(step.data);
      }
    };

    return (
      <div
        key={step.name}
        className="mb-4 border border-gray-200 rounded-md p-3"
      >
        <div className="flex items-center mb-2">
          {step.status === "started" ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          ) : step.status === "completed" ? (
            <svg
              className="h-4 w-4 text-green-500 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-red-500 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
          <h3 className="font-medium text-sm">
            {step.name
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </h3>
        </div>
        {step.status === "completed" && (
          <div className="ml-6 text-sm">{renderStepData()}</div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Search Results</h1>

          <div className="mb-8">
            <SearchBox
              initialQuery={query}
              useHyde={useHyde}
            />
            <div className="flex items-center justify-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="search-hyde-toggle"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={useHyde}
                onChange={(e) => {
                  console.log(
                    "HyDE Checkbox Changed, new state:",
                    e.target.checked
                  );
                  setUseHyde(e.target.checked);
                }}
              />
              <label
                htmlFor="search-hyde-toggle"
                className="text-sm font-medium cursor-pointer"
              >
                Use Enhanced Search (HyDE)
              </label>
            </div>
          </div>

          {status === "unauthenticated" ? (
            <UnauthenticatedSearchWarning />
          ) : (
            <>
              {loading ? (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      Processing your search...
                    </h2>
                    <button
                      onClick={() => setShowThinking(!showThinking)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {showThinking ? "Hide thinking" : "Show thinking"}
                      <svg
                        className={`ml-1 h-4 w-4 transform transition-transform ${
                          showThinking ? "rotate-180" : ""
                        }`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  {showThinking && thinkingSteps.length > 0 && (
                    <div className="bg-white border rounded-lg p-4">
                      {thinkingSteps.map(renderThinkingStep)}
                    </div>
                  )}
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              ) : (
                <>
                  {/* If we have thinking steps but we're no longer loading, show the toggle */}
                  {thinkingSteps.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Search Process</h2>
                      <button
                        onClick={() => setShowThinking(!showThinking)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {showThinking ? "Hide thinking" : "Show thinking"}
                        <svg
                          className={`ml-1 h-4 w-4 transform transition-transform ${
                            showThinking ? "rotate-180" : ""
                          }`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Show thinking steps if toggle is on and we have steps */}
                  {showThinking && thinkingSteps.length > 0 && (
                    <div className="bg-white border rounded-lg p-4 mb-6">
                      {thinkingSteps.map(renderThinkingStep)}
                    </div>
                  )}

                  {results.length > 0 ? (
                    <div className="space-y-6">
                      <p className="text-gray-600 dark:text-gray-400">
                        Found {results.length} results for &quot;{query}&quot;
                      </p>
                      {results.map((result) => {
                        // Convert SearchResult to Profile for the ProfileCard
                        const profile: ProfileFrontend = {
                          id: result.profile.id,
                          user_id: result.profile.user_id,
                          firstName: result.profile.full_name
                            ? result.profile.full_name.split(" ")[0]
                            : "Unknown",
                          lastName: result.profile.full_name
                            ? result.profile.full_name
                                .split(" ")
                                .slice(1)
                                .join(" ")
                            : "",
                          headline: result.profile.headline,
                          summary: result.profile.summary,
                          location: result.profile.location,
                          industry: result.profile.industry,
                          profileUrl: result.profile.profile_url || "",
                          profilePicture: result.profile.profile_picture_url,
                          highlights: result.highlights,
                          raw_profile_data: result.profile.raw_profile_data,
                        };

                        // Check if this profile is selected
                        const isSelected = selectedProfiles.some(
                          (p) => p.id === profile.id
                        );

                        return (
                          <ProfileCard
                            key={profile.id}
                            profile={profile}
                            matchScore={result.score}
                            selectable={true}
                            isSelected={isSelected}
                            onSelect={handleProfileSelect}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    query && (
                      <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          No results found for &quot;{query}&quot;
                        </p>
                        <p className="text-gray-500 dark:text-gray-500">
                          Try a different search term or broaden your query
                        </p>
                      </div>
                    )
                  )}
                </>
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
