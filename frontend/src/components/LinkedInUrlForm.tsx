"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkedInUrlFormProps {
  userId: string;
  linkedInAuthData: any;
  onSubmit: (linkedInUrl: string) => Promise<void>;
}

export default function LinkedInUrlForm({
  userId,
  linkedInAuthData,
  onSubmit,
}: LinkedInUrlFormProps) {
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!linkedInUrl) {
      setError("LinkedIn URL is required");
      return;
    }

    // Simple regex to validate LinkedIn URL format
    const linkedInUrlRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
    if (!linkedInUrlRegex.test(linkedInUrl)) {
      setError(
        "Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)"
      );
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(linkedInUrl);
      router.push("/dashboard"); // Redirect to dashboard after successful submission
    } catch (err: any) {
      setError(err.message || "Failed to verify LinkedIn profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
      <p className="mb-4">
        Please enter your LinkedIn profile URL to complete your registration.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="linkedInUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            LinkedIn Profile URL
          </label>
          <input
            type="text"
            id="linkedInUrl"
            value={linkedInUrl}
            onChange={(e) => setLinkedInUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
