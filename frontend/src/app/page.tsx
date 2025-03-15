"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Layout from "@/components/Layout";
import HomeContent from "@/components/HomeContent";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If the user is authenticated but doesn't exist in the database, redirect to complete-profile
    if (status === "authenticated") {
      console.log("Session in HomePage:", session);

      // Force redirection if user doesn't exist
      if (session?.exists === false) {
        console.log("User does not exist, redirecting to complete-profile");
        // Use replace instead of push for a hard redirect
        router.replace("/complete-profile");
        return;
      }
    }
  }, [session, status, router]);

  // Flat list of suggestions
  const suggestions = [
    "Software Engineers",
    "Product Managers",
    "UX Designers",
    "Data Scientists",
    "Marketing",
    "React.js",
    "Machine Learning",
    "Project Management",
    "Public Speaking",
    "Leadership",
    "Google",
    "Microsoft",
    "Amazon",
    "Facebook",
    "Apple",
    "Startups",
    "AI",
    "Python",
    "Healthcare",
    "Fintech",
  ];

  // If we're still loading or the user doesn't exist, show a loading state
  if (
    status === "loading" ||
    (status === "authenticated" && session?.exists === false)
  ) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <HomeContent
        isAuthenticated={status === "authenticated"}
        suggestions={suggestions}
      />
    </Layout>
  );
}
