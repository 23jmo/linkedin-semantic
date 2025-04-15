"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WaitlistForm } from "@/components/LinkedInUrlForm";
// import { createUser } from "@/lib/api";
import { addToWaitlist } from "@/lib/server/waitlist";

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      // If user exists in the database, redirect to main page
      if (session?.exists === true) {
        router.push("/");
      } else {
        setIsLoading(false);
      }
    }
  }, [status, session, router]);

  const handleSubmitWaitlist = async (email: string) => {
    try {
      await addToWaitlist(email);
      console.log("Added to waitlist");
    } catch (error) {
      console.error("Error adding to waitlist:", error);
    }
  };

  // const handleSubmitLinkedInUrl = async (linkedInUrl: string) => {
  //   if (!session?.user?.id) {
  //     throw new Error("User ID not found");
  //   }

  //   try {
  //     setIsLoading(true);

  //     // Call the API to create the user with the provided LinkedIn URL
  //     await createUser(session.user, session.user, linkedInUrl);

  //     // Force a session refresh to update the exists flag
  //     const event = new Event("visibilitychange");
  //     document.dispatchEvent(event);

  //     // Redirect to main page after successful creation
  //     setTimeout(() => router.push("/"), 1000);
  //   } catch (error) {
  //     console.error("Error creating user:", error);
  //     setIsLoading(false);
  //     throw error;
  //   }
  // };

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
          Locked In
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {session?.user?.id && (
          // <LinkedInUrlForm
          //   userId={session.user.id}
          //   linkedInAuthData={{
          //     email: session.user.email || "",
          //     name: session.user.name || "",
          //     image: session.user.image ?? undefined,
          //   }}
          //   onSubmit={handleSubmitLinkedInUrl}
          // />
          <WaitlistForm
            userId={session.user.id}
            linkedInAuthData={{
              email: session.user.email || "",
              name: session.user.name || "",
              image: session.user.image ?? undefined,
            }}
            onSubmit={handleSubmitWaitlist}
          />
        )}
      </div>
    </div>
  );
}
