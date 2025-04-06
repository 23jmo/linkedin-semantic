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
    console.log("Session state:", {
      status,
      exists: session?.exists,
      userId: session?.user?.id,
    });
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
    "Google Interns in Palo Alto this Summer",
    "Amazon Engineers in Seattle",
    "UX Designers in San Francisco",
    "Data Scientists in New York",
    "Marketing in Los Angeles",
    "Machine Learning in San Francisco",
    "Project Management in New York",
    "Public Speaking",
    "Apple Interns in Cupertino",
    "Google Engineers in Mountain View",
    "Fintech in New York",
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
