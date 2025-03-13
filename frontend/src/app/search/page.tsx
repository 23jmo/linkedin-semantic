"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SearchBox from "@/components/SearchBox";
import ProfileCard from "@/components/ProfileCard";
import LoadingIndicator from "@/components/LoadingIndicator";
import Header from "@/components/Header";
import UnauthenticatedSearchWarning from "@/components/UnauthenticatedSearchWarning";

interface Profile {
  id: string;
  linkedin_id: string;
  name: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  profile_url?: string;
  profile_image_url?: string;
  score: number;
  highlights?: string[];
}

export default function SearchPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchStream, setSearchStream] = useState<string[]>([
    "Searching for profiles matching your query...",
    "Analyzing semantic meaning...",
    "Retrieving relevant profiles...",
  ]);

  useEffect(() => {
    if (!query || !isAuthenticated) return;

    // Reset state
    setLoading(true);
    setSearchResults([]);

    // Simulate loading with stream of text
    const streamInterval = setInterval(() => {
      setSearchStream((prev) => [
        ...prev,
        `Found ${Math.floor(Math.random() * 5) + 1} potential matches...`,
      ]);
    }, 1000);

    // Simulate API call
    setTimeout(() => {
      clearInterval(streamInterval);

      // Mock data
      const mockResults: Profile[] = [
        {
          id: "1",
          linkedin_id: "john-doe",
          name: "John Doe",
          headline: "Software Engineer at Google",
          summary:
            "Experienced software engineer with a focus on AI and machine learning.",
          location: "San Francisco, CA",
          industry: "Technology",
          profile_url: "https://linkedin.com/in/john-doe",
          profile_image_url: "https://randomuser.me/api/portraits/men/1.jpg",
          score: 0.95,
          highlights: ["AI experience", "Machine learning", "Google"],
        },
        {
          id: "2",
          linkedin_id: "jane-smith",
          name: "Jane Smith",
          headline: "Product Manager at Microsoft",
          summary: "Product leader with experience in enterprise software.",
          location: "Seattle, WA",
          industry: "Technology",
          profile_url: "https://linkedin.com/in/jane-smith",
          profile_image_url: "https://randomuser.me/api/portraits/women/2.jpg",
          score: 0.85,
          highlights: [
            "Product management",
            "Enterprise software",
            "Microsoft",
          ],
        },
        {
          id: "3",
          linkedin_id: "bob-johnson",
          name: "Bob Johnson",
          headline: "Data Scientist at Amazon",
          summary:
            "Data scientist with expertise in machine learning and big data.",
          location: "New York, NY",
          industry: "Technology",
          profile_url: "https://linkedin.com/in/bob-johnson",
          profile_image_url: "https://randomuser.me/api/portraits/men/3.jpg",
          score: 0.75,
          highlights: ["Data science", "Machine learning", "Amazon"],
        },
      ];

      setSearchResults(mockResults);
      setLoading(false);
    }, 5000);

    return () => clearInterval(streamInterval);
  }, [query, isAuthenticated]);

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold text-center mb-8">
            LinkedIn Semantic Search
          </h1>

          <div className="mb-12 w-full">
            <SearchBox initialQuery={query} />
          </div>

          {!isAuthenticated ? (
            <UnauthenticatedSearchWarning />
          ) : loading ? (
            <LoadingIndicator messages={searchStream} />
          ) : (
            <div className="w-full">
              <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
              <p className="mb-6">
                Found {searchResults.length} profiles matching &quot;{query}
                &quot;
              </p>

              <div className="space-y-6">
                {searchResults.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
