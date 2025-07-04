"use client";

import { useState } from "react";
//import { useRouter } from "next/navigation";
import SignOut from "./sign-out";
import { AuthData } from "../types/types";
import { useTheme } from "@/lib/theme-context";

interface WaitlistFormProps {
  userId: string;
  linkedInAuthData: AuthData;
  onSubmit: (email: string) => Promise<void>;
}

interface LinkedInUrlFormProps {
  userId: string;
  linkedInAuthData: AuthData;
  onSubmit: (linkedInUrl: string) => Promise<void>;
}

export function LinkedInUrlForm({ onSubmit }: LinkedInUrlFormProps) {
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  //const router = useRouter();
  const { resolvedTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!linkedInUrl) {
      setError("LinkedIn URL is required");
      return;
    }

    // Simple regex to validate LinkedIn URL format
    const linkedInUrlRegex =
      /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;

    if (!linkedInUrlRegex.test(linkedInUrl)) {
      setError(
        "Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)",
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

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`max-w-md mx-auto p-6 rounded-lg shadow-md ${
        isDark ? "bg-gray-800" : "bg-white"
      }`}
    >
      <h2
        className={`text-2xl font-bold mb-4 ${
          isDark ? "text-gray-200" : "text-gray-800"
        }`}
      >
        Complete Your Profile
      </h2>
      <p className={`mb-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
        Please enter your LinkedIn profile URL to complete your registration.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="linkedInUrl"
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            LinkedIn Profile URL
          </label>
          <input
            type="text"
            id="linkedInUrl"
            value={linkedInUrl}
            onChange={(e) => setLinkedInUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/username"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
              isDark
                ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
                : "border-gray-300"
            }`}
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
          className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark
              ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
              : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
          }`}
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

export function WaitlistForm({ onSubmit }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { resolvedTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSuccess(false);

    // Basic validation
    if (!email) {
      setError("Email is required");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(email);
      setIsSuccess(true);
      setEmail(""); // Clear the form
    } catch (error) {
      console.error("Waitlist submission error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to join waitlist. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`max-w-md mx-auto p-6 rounded-lg shadow-md ${
        isDark ? "bg-gray-800" : "bg-white"
      }`}
    >
      <h2
        className={`text-2xl font-bold mb-4 ${
          isDark ? "text-gray-200" : "text-gray-800"
        }`}
      >
        Join Our Waitlist
      </h2>
      <p className={`mb-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
        Sorry, but we&apos;re at capacity right now. Sign up for our waitlist to
        be notified when we open up more spots!
      </p>

      {isSuccess ? (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <p className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Thanks for joining! We&apos;ll notify you when spots open up.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
                  : "border-gray-300"
              }`}
              disabled={isLoading}
              aria-describedby={error ? "email-error" : undefined}
            />

            {error && (
              <p
                id="email-error"
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
            className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
                : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
            }`}
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
                Joining Waitlist...
              </span>
            ) : (
              "Join Waitlist"
            )}
          </button>
        </form>
      )}
      <div className="mt-4">
        <SignOut />
      </div>
    </div>
  );
}
