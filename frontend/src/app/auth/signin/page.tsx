"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaLinkedin } from "react-icons/fa";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get the callback URL from the query parameters, default to "/"
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Get error from URL if present
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Set error message based on error parameter
  useEffect(() => {
    if (errorParam) {
      console.error(
        "Authentication error from URL:",
        errorParam,
        errorDescription
      );

      // Set appropriate error message based on error type
      if (errorParam === "OAuthCallback") {
        setError("LinkedIn authentication failed. Please try again.");
      } else if (errorParam === "AccessDenied") {
        setError(
          "Access was denied. Please ensure you grant all required permissions."
        );
      } else if (errorParam === "Configuration") {
        setError("There was a configuration error. Please contact support.");
      } else {
        setError(
          `Authentication error: ${errorParam}${
            errorDescription ? ` - ${errorDescription}` : ""
          }`
        );
      }
    }
  }, [errorParam, errorDescription]);

  // Redirect to the main page if the user is already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("User already authenticated, redirecting to:", callbackUrl);
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("An error occurred during sign in");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLoading(true);
    setError(""); // Clear any previous errors
    try {
      console.log("Initiating LinkedIn sign-in, redirecting to:", callbackUrl);
      await signIn("linkedin", {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("LinkedIn sign in error:", error);
      setError("Failed to connect to LinkedIn. Please try again.");
      setLoading(false);
    }
  };

  // If the user is already authenticated, show a loading state
  if (status === "loading" || (status === "authenticated" && session)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-gray-600 mb-4">
            You are already signed in. Redirecting to the main page...
          </p>
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-700 mb-2">{error}</p>
            <p className="text-sm text-gray-600">
              Please try again or{" "}
              <Link
                href="/"
                className="text-blue-600 hover:underline"
              >
                return to the home page
              </Link>
            </p>
          </div>
        )}

        <button
          onClick={handleLinkedInSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg mb-6 hover:bg-blue-700 transition-colors"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
              Connecting to LinkedIn...
            </>
          ) : (
            <>
              <FaLinkedin
                className="mr-2"
                size={20}
              />
              Sign in with LinkedIn
            </>
          )}
        </button>

        {/* Debug information in development mode */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 border border-gray-200 rounded-lg text-xs text-gray-500">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <p>Session Status: {status}</p>
            <p>Callback URL: {callbackUrl}</p>
            {errorParam && <p>Error: {errorParam}</p>}
            {errorDescription && <p>Error Description: {errorDescription}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
