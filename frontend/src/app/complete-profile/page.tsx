"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LinkedInUrlForm } from "@/components/LinkedInUrlForm";
// import { WaitlistForm } from "@/components/LinkedInUrlForm";
import { createUser } from "@/lib/api";
import Image from "next/image";
// import { addToWaitlist } from "@/lib/server/waitlist";

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [createStatus, setCreateStatus] = useState("");
  const [createStage, setCreateStage] = useState("");
  const [error, setError] = useState("");
  const [createDetails, setCreateDetails] = useState("");

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

  // const handleSubmitWaitlist = async (email: string) => {
  //   try {
  //     await addToWaitlist(email);
  //     console.log("Added to waitlist");
  //   } catch (error) {
  //     console.error("Error adding to waitlist:", error);
  //   }
  // };

  const handleSubmitLinkedInUrl = async (linkedInUrl: string) => {
    if (!session?.user?.id) {
      throw new Error("User ID not found");
    }

    try {
      setIsLoading(true);
      setCreateStatus("Starting profile creation...");
      setError("");

      // Progress callback for streaming updates
      const handleProgress = (
        message: string,
        stage: string,
        details?: string,
      ) => {
        setCreateStatus(message);
        setCreateStage(stage);
        setCreateDetails(details || "");
      };

      // Call the API to create the user with the provided LinkedIn URL
      await createUser(session.user, session.user, linkedInUrl, handleProgress);

      // Force a session refresh to update the exists flag
      const event = new Event("visibilitychange");
      document.dispatchEvent(event);

      // Redirect to main page after successful creation
      setTimeout(() => router.push("/"), 1000);
    } catch (error) {
      console.error("Error creating user:", error);
      setIsLoading(false);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  const renderLoadingState = () => {
    if (!isLoading) return null;

    return (
      <div
        className="flex flex-col justify-center items-center min-h-screen"
        data-oid="u3gj2nr"
      >
        <div
          className="flex justify-center items-center min-h-screen"
          data-oid="n69ya34"
        >
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-500"
            data-oid="w789oj1"
          ></div>
          <Image
            className="absolute"
            src="/LogoBlack.png"
            alt="Logo"
            width={32}
            height={32}
            data-oid="3l8c_rs"
          />
        </div>

        {createStatus && (
          <div className="text-center max-w-md mx-auto" data-oid="idct2hq">
            <p
              className="text-lg font-medium text-gray-800 mb-2"
              data-oid="4d.qh1a"
            >
              {createStatus}
            </p>

            {createStage && (
              <div
                className="w-full bg-gray-200 rounded-full h-2.5 mb-4"
                data-oid="wxc9y1-"
              >
                <div
                  className="bg-blue-600 h-2.5 rounded-full animate-pulse"
                  style={{ width: "100%" }}
                  data-oid="37h0tw4"
                ></div>
              </div>
            )}

            {createDetails && (
              <p className="text-sm text-gray-600" data-oid="_kx96rl">
                {createDetails}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="text-red-500 mt-4 text-center" data-oid="wxllbiu">
            {error}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return renderLoadingState();
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      data-oid="gj52v0g"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md" data-oid="r0bjidz">
        <h1
          className="text-center text-3xl font-extrabold text-gray-900"
          data-oid="y_vthu:"
        >
          Locked In
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" data-oid="5y9.5wu">
        {
          session?.user?.id && (
            <LinkedInUrlForm
              userId={session.user.id}
              linkedInAuthData={{
                email: session.user.email || "",
                name: session.user.name || "",
                image: session.user.image ?? undefined,
              }}
              onSubmit={handleSubmitLinkedInUrl}
              data-oid="osk86ki"
            />
          )

          // <WaitlistForm
          //   userId={session.user.id}
          //   linkedInAuthData={{
          //     email: session.user.email || "",
          //     name: session.user.name || "",
          //     image: session.user.image ?? undefined,
          //   }}
          //   onSubmit={handleSubmitWaitlist}
          // />
        }
      </div>
    </div>
  );
}
