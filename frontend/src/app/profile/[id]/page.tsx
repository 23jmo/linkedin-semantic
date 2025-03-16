"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/Layout";
import EmailGenerator from "@/components/EmailGenerator";
import { useTheme } from "@/lib/theme-context";

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // In a real app, you would fetch the profile data here
    // For now, we'll just simulate loading
    setLoading(false);
    setProfile({
      id: profileId,
      name: "Sample User",
      role: "Software Engineer",
    });
  }, [profileId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1
          className={`text-3xl font-bold mb-6 ${
            resolvedTheme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Profile: {profile?.name}
        </h1>

        <div
          className={`mb-8 p-6 rounded-lg shadow ${
            resolvedTheme === "dark"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-900"
          }`}
        >
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <p>
            <strong>Name:</strong> {profile?.name}
          </p>
          <p>
            <strong>Role:</strong> {profile?.role}
          </p>
          <p>
            <strong>ID:</strong> {profile?.id}
          </p>
        </div>

        {/* Email Generator Component */}
        <EmailGenerator />
      </div>
    </Layout>
  );
}
