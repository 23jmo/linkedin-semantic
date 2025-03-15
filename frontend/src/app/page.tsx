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
        "People with React.js experience",
        "Machine Learning experts",
        "Project Management professionals",
        "Public Speaking skills",
        "Leadership experience in startups",
      ],
    },
    {
      title: "By Company",
      items: [
        "Former Google employees",
        "People who worked at Microsoft",
        "Amazon alumni in product roles",
        "Facebook engineers",
        "Apple designers",
      ],
    },
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
