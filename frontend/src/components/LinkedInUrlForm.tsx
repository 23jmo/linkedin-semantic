"use client";

import { useState } from "react";
//import { useRouter } from "next/navigation";
import SignOut from "./sign-out";
import { AuthData } from "../types/types";

interface LinkedInUrlFormProps {
  userId: string;
  linkedInAuthData: AuthData;
  onSubmit: (linkedInUrl: string) => Promise<void>;
}

export default function LinkedInUrlForm({ onSubmit }: LinkedInUrlFormProps) {
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  //const router = useRouter();

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
      // No need to handle redirect here as it's managed by the parent
    } catch (error) {
      console.error("LinkedIn URL submission error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to verify LinkedIn profile. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
      <p className="mb-4">
        Please enter your LinkedIn profile URL to complete your registration.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
            aria-describedby={error ? "url-error" : undefined}
          />
          {error && (
            <p
              id="url-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating Profile...
            </span>
          ) : (
            "Continue"
          )}
        </button>
      </form>
      <div className="mt-4">
        <SignOut />
      </div>
    </div>
  );
}
