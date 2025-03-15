"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Layout from "@/components/Layout";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("DashboardPage - Session status:", status);
    console.log("DashboardPage - Session data:", session);

    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      console.log(
        "DashboardPage - User is not authenticated, redirecting to home"
      );
      router.push("/");
    } else if (status === "authenticated") {
      console.log("DashboardPage - User is authenticated");
      // If user doesn't exist in the database, redirect to complete-profile
      if (session?.exists === false) {
        console.log(
          "DashboardPage - User does not exist, redirecting to complete-profile"
        );
        router.push("/complete-profile");
      } else {
        console.log("DashboardPage - User exists, showing dashboard");
        setIsLoading(false);
      }
    }
  }, [status, session, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {session?.user?.name || "Not available"}
            </p>
            <p>
              <strong>Email:</strong> {session?.user?.email || "Not available"}
            </p>
            <p>
              <strong>Profile Status:</strong>{" "}
              {session?.exists ? "Complete" : "Incomplete"}
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
          <p className="text-gray-500">
            You haven't performed any searches yet.
          </p>
        </div>
      </div>
    </Layout>
  );
}
