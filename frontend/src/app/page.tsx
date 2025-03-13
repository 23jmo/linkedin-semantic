"use client";

import { useSession } from "next-auth/react";
import SearchBox from "@/components/SearchBox";
import SuggestionBox from "@/components/SuggestionBox";
import Header from "@/components/Header";
import AuthPrompt from "@/components/AuthPrompt";

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Sample suggestions for demonstration
  const suggestions = [
    {
      title: "By Role",
      items: [
        "Software Engineers with experience in AI",
        "Product Managers in fintech",
        "UX Designers who worked at Google",
        "Data Scientists with Python experience",
        "Marketing professionals in healthcare",
      ],
    },
    {
      title: "By Skill",
      items: [
        "Machine Learning experts",
        "React developers",
        "People with leadership experience",
        "Public speaking skills",
        "Project management certified",
      ],
    },
    {
      title: "By Company",
      items: [
        "Ex-Google employees",
        "People who worked at startups",
        "Microsoft alumni",
        "Amazon employees",
        "Facebook engineers",
      ],
    },
  ];

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold text-center mb-8">
            LinkedIn Semantic Search
          </h1>

          <div className="mb-12 w-full">
            {isAuthenticated ? <SearchBox /> : <AuthPrompt />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestions.map((suggestion, index) => (
              <SuggestionBox
                key={index}
                title={suggestion.title}
                items={suggestion.items}
              />
            ))}
          </div>

          {!isAuthenticated && (
            <div className="mt-12 text-center text-gray-600">
              <p>
                Sign in to unlock the full power of semantic search on your
                LinkedIn network
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
