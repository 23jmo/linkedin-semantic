"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SearchBox from "@/components/SearchBox";
import ProfileCard from "@/components/ProfileCard";
import LoadingIndicator from "@/components/LoadingIndicator";
import Layout from "@/components/Layout";
import UnauthenticatedSearchWarning from "@/components/UnauthenticatedSearchWarning";
import SelectionChip from "@/components/SelectionChip";
import EmailComposer from "@/components/EmailComposer";
import { Profile } from "@/types/profile";

import { semanticSearch } from "@/lib/api";

interface SearchResult {
  profile: {
    id: string;
    linkedin_id: string;
    full_name: string;
    headline?: string;
    summary?: string;
    location?: string;
    industry?: string;
    profile_url?: string;
    profile_picture_url?: string;
    raw_profile_data?: any;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
  score: number;
  highlights?: string[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for selected profiles
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      if (status === "authenticated") {
        performSearch(q);
      }
    }
  }, [searchParams, status]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Mock API call - replace with actual API call
      console.log("Starting search with loading state:", loading);

      const profiles = await semanticSearch(searchQuery);
      console.log("Profiles:", profiles);

      setResults(profiles);
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle profile selection
  const handleProfileSelect = (profile: Profile, selected: boolean) => {
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
            <SearchBox initialQuery={query} />
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
                        Found {results.length} results for "{query}"
                      </p>
                      {results.map((result) => {
                        // Convert SearchResult to Profile for the ProfileCard
                        const profile: Profile = {
                          id: result.profile.id,
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
                          No results found for "{query}"
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
