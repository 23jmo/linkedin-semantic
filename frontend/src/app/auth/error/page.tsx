"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>(
    "An authentication error occurred"
  );

  // Get error parameters
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      OAuthSignin: "Error starting the sign-in process with LinkedIn.",
      OAuthCallback: "Error during the LinkedIn authentication process.",
      OAuthCreateAccount:
        "Error creating your account with LinkedIn information.",
      EmailCreateAccount: "Error creating your account.",
      Callback: "Error during the authentication callback process.",
      OAuthAccountNotLinked:
        "This LinkedIn account is already linked to another account.",
      EmailSignin: "Error sending the sign-in email.",
      CredentialsSignin: "The sign-in credentials are invalid.",
      SessionRequired: "You need to be signed in to access this page.",
      Default: "An unknown authentication error occurred.",
      Timeout: "The authentication process timed out.",
      MaxRetries: "Maximum authentication retries reached.",
    };

    // Set the error message based on the error code
    if (error && errorMessages[error]) {
      setErrorMessage(errorMessages[error]);

      // Add error description if available
      if (error_description) {
        setErrorMessage(`${errorMessages[error]} ${error_description}`);
      }
    } else if (error_description) {
      setErrorMessage(error_description);
    }

    // Log error details in development
    if (process.env.NODE_ENV === "development") {
      console.error("Auth error:", {
        error,
        error_description,
        callbackUrl,
      });
    }
  }, [error, error_description, callbackUrl]);

  // Function to retry authentication
  const handleRetry = async () => {
    await signIn("linkedin", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          Authentication Error
        </h1>
        <p className="text-gray-800 mb-6">{errorMessage}</p>

        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again with LinkedIn
          </button>

          <Link
            href="/"
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
          >
            Return to Home
          </Link>
        </div>

        {/* Troubleshooting tips */}
        <div className="mt-8 text-left text-sm text-gray-600">
          <h2 className="font-semibold mb-2">Troubleshooting Tips:</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Make sure you're using a valid LinkedIn account</li>
            <li>Clear your browser cookies and try again</li>
            <li>Try using a different browser</li>
            <li>Check if LinkedIn services are experiencing issues</li>
          </ul>
        </div>

        {/* Debug information in development mode */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 border border-gray-200 rounded-lg text-xs text-gray-500 text-left">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <p>Error: {error || "None"}</p>
            <p>Error Description: {error_description || "None"}</p>
            <p>Callback URL: {callbackUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}
