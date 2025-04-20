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
  const renderThinkingUI = () => {
    // Get completed steps data
    const relevantSections =
      thinkingSteps.find(
        (step) =>
          step.name === "relevant_sections" && step.status === "completed"
      )?.data || [];
    const traits =
      thinkingSteps.find(
        (step) => step.name === "traits" && step.status === "completed"
      )?.data || [];
    const keyPhrases =
      thinkingSteps.find(
        (step) => step.name === "key_phrases" && step.status === "completed"
      )?.data || [];
    const sqlQuery = thinkingSteps.find(
      (step) => step.name === "sql_query" && step.status === "completed"
    )?.data;

    // Check if a specific step is in progress
    const isRelevantSectionsLoading = thinkingSteps.some(
      (step) => step.name === "relevant_sections" && step.status === "started"
    );
    const isTraitsLoading = thinkingSteps.some(
      (step) => step.name === "traits" && step.status === "started"
    );
    const isKeyPhrasesLoading = thinkingSteps.some(
      (step) => step.name === "key_phrases" && step.status === "started"
    );
    const isSqlQueryLoading = thinkingSteps.some(
      (step) => step.name === "sql_query" && step.status === "started"
    );
    const isSearchExecutionLoading = thinkingSteps.some(
      (step) => step.name === "search_execution" && step.status === "started"
    );

    // Get the current active loading step (for display at bottom)
    const activeLoadingStep = thinkingSteps.find(
      (step) => step.status === "started"
    );

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
        {/* Header with toggle - entire header is now clickable */}
        <button
          onClick={() => setShowThinking(!showThinking)}
          className="flex items-center justify-between w-full mb-4 focus:outline-none text-left"
          aria-expanded={showThinking}
        >
          <div className="flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-700">
              {showThinking ? "Hide thinking" : "Show thinking"}
            </h2>
          </div>
          <svg
            className={`h-5 w-5 text-gray-600 transform transition-transform ${
              showThinking ? "rotate-180" : ""
            } flex-shrink-0`}
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

        {!showThinking && (
          <div className="text-center text-gray-500 text-xs">
            (Thinking process hidden)
          </div>
        )}

        {showThinking && (
          <>
            {/* Filters Section - with skeleton loading */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <h3 className="font-medium text-gray-700">Filters</h3>
                {isRelevantSectionsLoading && (
                  <div className="ml-2 animate-pulse">
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="pl-6 space-y-2">
                {isRelevantSectionsLoading ? (
                  // Skeleton loading
                  <>
                    <div className="flex items-center space-x-2 animate-pulse">
                      <div className="h-4 w-4 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                      <div className="h-3 w-32 bg-gray-300 rounded"></div>
                    </div>
                    <div className="flex items-center space-x-2 animate-pulse">
                      <div className="h-4 w-4 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="h-3 w-20 bg-gray-300 rounded"></div>
                      <div className="h-3 w-40 bg-gray-300 rounded"></div>
                    </div>
                  </>
                ) : (
                  relevantSections.length > 0 && (
                    <>
                      <div className="flex items-center space-x-2">
                        <svg
                          className="h-4 w-4 text-gray-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-gray-600">Location</span>
                        <span className="text-gray-800">
                          Bay Area, California
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg
                          className="h-4 w-4 text-gray-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <span className="text-gray-600">Education</span>
                        <span className="text-gray-800">
                          Including education experience
                        </span>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>

            {/* Traits Section - with skeleton loading */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <h3 className="font-medium text-gray-700">Traits</h3>
                {isTraitsLoading && (
                  <div className="ml-2 animate-pulse">
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="pl-6">
                <div className="flex flex-wrap">
                  {isTraitsLoading ? (
                    // Skeleton loading for traits
                    <>
                      <div className="inline-block bg-gray-300 h-6 w-16 rounded mr-2 mb-2 animate-pulse"></div>
                      <div className="inline-block bg-gray-300 h-6 w-24 rounded mr-2 mb-2 animate-pulse"></div>
                      <div className="inline-block bg-gray-300 h-6 w-20 rounded mr-2 mb-2 animate-pulse"></div>
                      <div className="inline-block bg-gray-300 h-6 w-28 rounded mr-2 mb-2 animate-pulse"></div>
                    </>
                  ) : (
                    traits.map((trait: string) => (
                      <span
                        key={trait}
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2 mb-2"
                      >
                        {trait}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Key Phrases Section - with skeleton loading */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <h3 className="font-medium text-gray-700">Key phrases</h3>
                {isKeyPhrasesLoading && (
                  <div className="ml-2 animate-pulse">
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="pl-6">
                <div className="flex flex-wrap">
                  {isKeyPhrasesLoading ? (
                    // Skeleton loading for key phrases
                    <>
                      <div className="inline-block bg-gray-300 h-6 w-32 rounded mr-2 mb-2 animate-pulse"></div>
                      <div className="inline-block bg-gray-300 h-6 w-40 rounded mr-2 mb-2 animate-pulse"></div>
                      <div className="inline-block bg-gray-300 h-6 w-36 rounded mr-2 mb-2 animate-pulse"></div>
                      <div className="inline-block bg-gray-300 h-6 w-28 rounded mr-2 mb-2 animate-pulse"></div>
                    </>
                  ) : (
                    keyPhrases.map(
                      (phrase: {
                        key_phrase: string;
                        relevant_section: string;
                      }) => (
                        <span
                          key={phrase.key_phrase}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2 mb-2"
                        >
                          {phrase.key_phrase}
                        </span>
                      )
                    )
                  )}
                </div>
              </div>
            </div>

            {/* SQL Query Section - with skeleton loading */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
                <h3 className="font-medium text-gray-700">SQL query</h3>
                {isSqlQueryLoading && (
                  <div className="ml-2 animate-pulse">
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="pl-6">
                {isSqlQueryLoading ? (
                  // Skeleton loading for SQL query
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-11/12 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-4/5 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ) : (
                  sqlQuery && (
                    <pre className="bg-gray-100 text-gray-800 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {sqlQuery}
                    </pre>
                  )
                )}
              </div>
            </div>

            {/* Active loading step indicator - now at the bottom */}
            {activeLoadingStep && (
              <div className="mt-4 py-2 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
                  <span>
                    Processing:{" "}
                    {activeLoadingStep.name
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                    ...
                  </span>
                </div>
              </div>
            )}

            {/* Search execution result - appears after search is done */}
            {thinkingSteps.some(
              (step) =>
                step.name === "search_execution" && step.status === "completed"
            ) && (
              <div className="mt-4 py-2 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>
                    Found{" "}
                    {thinkingSteps.find(
                      (step) =>
                        step.name === "search_execution" &&
                        step.status === "completed"
                    )?.data?.count || 0}{" "}
                    results
                  </span>
                </div>
              </div>
            )}
          </>
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
              {/* Always show the thinking UI when there are steps, regardless of loading state */}
              {thinkingSteps.length > 0 && renderThinkingUI()}

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              ) : (
                <>
                  {results.length > 0 ? (
                    <div className="space-y-6">
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
