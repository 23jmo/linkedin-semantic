"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Get all query parameters for debugging
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error_param = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const id_token = searchParams.get("id_token"); // OpenID Connect might return this

  // Get the callback URL from the state parameter or default to "/"
  // The state parameter might contain encoded information including the callbackUrl
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Maximum number of retries for authentication
  const MAX_RETRIES = 3;
  // Timeout for authentication (in milliseconds)
  const AUTH_TIMEOUT = 10000;

  useEffect(() => {
    // Log all parameters for debugging
    const debugData = {
      code: code ? "present" : "not present",
      state,
      error: error_param,
      error_description,
      id_token: id_token ? "present" : "not present", // Don't log the actual token
      sessionStatus: status,
      callbackUrl,
      retryCount,
    };

    console.log("Auth callback params:", debugData);
    setDebugInfo(debugData);

    let timeoutId: NodeJS.Timeout;

    const handleCallback = async () => {
      // If there's an error parameter, show it
      if (error_param) {
        setError(
          `Authentication error: ${error_param} - ${
            error_description || "Unknown error"
          }`
        );
        return;
      }

      // If we have a session, redirect to the callback URL or home
      if (status === "authenticated" && session && !redirectAttempted) {
        console.log("Authentication successful, redirecting to:", callbackUrl);
        setRedirectAttempted(true);
        router.push(callbackUrl);
        return;
      }

      // If we have a code but no session yet, we might need to manually complete the sign-in
      if (
        code &&
        (status === "unauthenticated" || status === "loading") &&
        !redirectAttempted &&
        retryCount < MAX_RETRIES
      ) {
        try {
          console.log(
            `Attempting to complete authentication with code (attempt ${
              retryCount + 1
            }/${MAX_RETRIES})`
          );
          setRetryCount((prev) => prev + 1);

          // Try to manually complete the sign-in process
          const result = await signIn("linkedin", {
            redirect: false,
            callbackUrl,
            code,
            state,
          });

          if (result?.error) {
            console.error("Authentication error:", result.error);
            setError(`Failed to complete authentication: ${result.error}`);
          } else if (result?.ok) {
            console.log(
              "Manual authentication successful, redirecting to:",
              result.url || callbackUrl
            );
            setRedirectAttempted(true);
            router.push(result.url || callbackUrl);
          }
        } catch (err) {
          console.error("Error during manual sign-in:", err);
          setError("An unexpected error occurred during authentication");
        }
      }

      // If authentication failed and we've waited long enough, redirect to error page
      if (status === "unauthenticated" && !code && !redirectAttempted) {
        console.log("Authentication failed, redirecting to error page");
        setRedirectAttempted(true);
        router.push("/auth/error?error=OAuthCallback");
      }

      // If we've reached the maximum number of retries, redirect to error page
      if (retryCount >= MAX_RETRIES && !redirectAttempted) {
        console.error("Maximum authentication retries reached");
        setRedirectAttempted(true);
        router.push(
          `/auth/signin?error=MaxRetries&callbackUrl=${encodeURIComponent(
            callbackUrl
          )}`
        );
      }
    };

    handleCallback();

    // Set a timeout to redirect to the error page if authentication takes too long
    if (!redirectAttempted) {
      timeoutId = setTimeout(() => {
        if (!redirectAttempted && status !== "authenticated") {
          console.error("Authentication timed out");
          setRedirectAttempted(true);
          router.push(
            `/auth/signin?error=Timeout&callbackUrl=${encodeURIComponent(
              callbackUrl
            )}`
          );
        }
      }, AUTH_TIMEOUT);
    }

    // Clean up the timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    code,
    state,
    error_param,
    error_description,
    id_token,
    status,
    session,
    router,
    callbackUrl,
    redirectAttempted,
    retryCount,
  ]);

  // Function to manually retry authentication
  const handleRetry = async () => {
    setError(null);
    setRedirectAttempted(false);
    setRetryCount(0);

    try {
      await signIn("linkedin", {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      console.error("Error during retry:", err);
      setError("Failed to retry authentication");
    }
  };

  // If there's an error, show it
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            Authentication Error
          </h1>
          <p className="text-gray-800 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>

          {/* Debug information in development mode */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 border border-gray-200 rounded-lg text-xs text-gray-500 text-left">
              <h3 className="font-bold mb-2">Debug Information:</h3>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <p className="text-gray-600 mb-4">
          Please wait while we complete your sign in.
        </p>
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>

        {/* Debug information in development mode */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 border border-gray-200 rounded-lg text-xs text-gray-500 text-left">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <p>Session Status: {status}</p>
            <p>
              Retry Count: {retryCount}/{MAX_RETRIES}
            </p>
            <p>Redirect Attempted: {redirectAttempted ? "Yes" : "No"}</p>
            <p>Code Present: {code ? "Yes" : "No"}</p>
            <p>State: {state}</p>
            <p>Callback URL: {callbackUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}
