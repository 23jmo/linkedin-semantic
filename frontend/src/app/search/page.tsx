"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SearchBox from "@/components/SearchBox";
import ProfileCard from "@/components/ProfileCard";
import LoadingIndicator from "@/components/LoadingIndicator";
import Layout from "@/components/Layout";
import UnauthenticatedSearchWarning from "@/components/UnauthenticatedSearchWarning";

import { semanticSearch } from "@/lib/api";

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
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

      // // Mock data for demonstration
      // const mockProfiles: Profile[] = [
      //   {
      //     id: "1",
      //     linkedin_id: "john-doe",
      //     name: "John Doe",
      //     headline: "Senior Software Engineer at Tech Company",
      //     summary:
      //       "Experienced software engineer with a passion for building scalable applications. Over 8 years of experience in full-stack development with a focus on React, Node.js, and cloud technologies.",
      //     location: "San Francisco, CA",
      //     industry: "Information Technology",
      //     profile_url: "https://linkedin.com/in/john-doe",
      //     profile_image_url: "https://randomuser.me/api/portraits/men/1.jpg",
      //     score: 0.92,
      //     highlights: ["React", "Node.js", "Cloud Technologies"],
      //   },
      //   {
      //     id: "2",
      //     linkedin_id: "jane-smith",
      //     name: "Jane Smith",
      //     headline: "Product Manager | AI Enthusiast",
      //     summary:
      //       "Product leader with experience in AI and machine learning products. Passionate about creating user-centric solutions that leverage cutting-edge technology.",
      //     location: "New York, NY",
      //     industry: "Artificial Intelligence",
      //     profile_url: "https://linkedin.com/in/jane-smith",
      //     profile_image_url: "https://randomuser.me/api/portraits/women/2.jpg",
      //     score: 0.85,
      //     highlights: ["Product Management", "AI", "Machine Learning"],
      //   },
      //   {
      //     id: "3",
      //     linkedin_id: "alex-johnson",
      //     name: "Alex Johnson",
      //     headline: "UX Designer at Design Studio",
      //     summary:
      //       "Creative UX designer focused on creating beautiful and functional user experiences. Skilled in user research, wireframing, and prototyping.",
      //     location: "Seattle, WA",
      //     industry: "Design",
      //     profile_url: "https://linkedin.com/in/alex-johnson",
      //     profile_image_url: "https://randomuser.me/api/portraits/men/3.jpg",
      //     score: 0.78,
      //     highlights: ["UX Design", "User Research", "Prototyping"],
      //   },
      //   {
      //     id: "4",
      //     linkedin_id: "sarah-williams",
      //     name: "Sarah Williams",
      //     headline: "Data Scientist | Python Expert",
      //     summary:
      //       "Data scientist with a strong background in statistics and machine learning. Experienced in Python, R, and SQL for data analysis and model building.",
      //     location: "Boston, MA",
      //     industry: "Data Science",
      //     profile_url: "https://linkedin.com/in/sarah-williams",
      //     profile_image_url: "https://randomuser.me/api/portraits/women/4.jpg",
      //     score: 0.72,
      //     highlights: ["Python", "Machine Learning", "Data Analysis"],
      //   },
      //   {
      //     id: "5",
      //     linkedin_id: "michael-brown",
      //     name: "Michael Brown",
      //     headline: "Marketing Director at Health Tech",
      //     summary:
      //       "Marketing professional specializing in healthcare technology. Experienced in digital marketing, content strategy, and brand development.",
      //     location: "Chicago, IL",
      //     industry: "Healthcare",
      //     profile_url: "https://linkedin.com/in/michael-brown",
      //     profile_image_url: "https://randomuser.me/api/portraits/men/5.jpg",
      //     score: 0.65,
      //     highlights: ["Healthcare Marketing", "Digital Strategy", "Branding"],
      //   },
      // ];
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
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
                      {results.map((profile) => (
                        <ProfileCard
                          key={profile.id}
                          profile={{
                            ...profile,
                            firstName: profile.name.split(" ")[0],
                            lastName: profile.name
                              .split(" ")
                              .slice(1)
                              .join(" "),
                            profileUrl: profile.profile_url || "",
                            profilePicture: profile.profile_image_url,
                          }}
                          matchScore={profile.score}
                        />
                      ))}
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
    </Layout>
  );
}
