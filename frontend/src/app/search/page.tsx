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

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const profiles = await semanticSearch(searchQuery, useHyde);
        console.log("Profiles:", profiles);
        setResults(profiles);
      } catch (err) {
        console.error("Search error:", err);
        setError("An error occurred while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [useHyde, setLoading, setError, setResults]
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
            <div className="flex items-center space-x-2 mt-4">
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
                  // Optional: Re-run search when toggle changes
                  // performSearch(query);
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
                <LoadingIndicator />
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              ) : (
                <>
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
