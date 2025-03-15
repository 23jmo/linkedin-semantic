"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LinkedInUrlForm from "@/components/LinkedInUrlForm";
import { createUser } from "@/lib/api";

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("CompleteProfilePage - Session status:", status);
    console.log("CompleteProfilePage - Session data:", session);

    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      console.log(
        "CompleteProfilePage - User is not authenticated, redirecting to home"
      );
      router.push("/");
    } else if (status === "authenticated") {
      console.log("CompleteProfilePage - User is authenticated");
      // If user exists in the database, redirect to dashboard
      if (session?.exists === true && session?.needsProfile !== true) {
        console.log(
          "CompleteProfilePage - User exists and doesn't need profile, redirecting to main page"
        );
        router.push("/");
      } else {
        console.log(
          "CompleteProfilePage - User needs to complete profile, showing LinkedIn URL form"
        );
        setIsLoading(false);
      }
    }
  }, [status, session, router]);

  const handleSubmitLinkedInUrl = async (linkedInUrl: string) => {
    if (!session?.user?.id) {
      throw new Error("User ID not found");
    }

    try {
      setIsLoading(true);

      // Call the API to create the user with the provided LinkedIn URL
      await createUser(session.user, session.user, linkedInUrl);

      // Force a session refresh to update the exists flag
      const event = new Event("visibilitychange");
      document.dispatchEvent(event);

      // Short delay to allow session to refresh
      setTimeout(() => {
        // Redirect to main page after successful creation
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Error creating user:", error);
      setIsLoading(false);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          LinkedIn Semantic Search
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {session?.user?.id && (
          <LinkedInUrlForm
            userId={session.user.id}
            linkedInAuthData={{}} // Empty object for LinkedIn auth data
            onSubmit={handleSubmitLinkedInUrl}
          />
        )}
      </div>
    </div>
  );
}
