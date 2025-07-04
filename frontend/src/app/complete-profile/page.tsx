"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
//import { LinkedInUrlForm } from "@/components/LinkedInUrlForm";
import { WaitlistForm } from "@/components/LinkedInUrlForm";
import Image from "next/image";
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

  const renderLoadingState = () => {
    if (!isLoading) return null;

    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-500"></div>
          <Image
            className="absolute"
            src="/LogoBlack.png"
            alt="Logo"
            width={32}
            height={32}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return renderLoadingState();
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
