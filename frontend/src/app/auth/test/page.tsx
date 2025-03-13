"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthTest() {
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Update session data for display
    if (session) {
      setSessionData({
        user: session.user,
        expires: session.expires,
        // Don't display the access token in the UI for security reasons
        hasAccessToken: !!session.accessToken,
      });
    }
  }, [session]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Authentication Test Page
        </h1>

        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Session Status</h2>
          <p className="mb-2">
            Current status:{" "}
            <span
              className={`font-bold ${
                status === "authenticated"
                  ? "text-green-600"
                  : status === "loading"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {status}
            </span>
          </p>

          {status === "authenticated" && (
            <div>
              <p className="mb-1">
                Signed in as:{" "}
                <span className="font-semibold">
                  {session?.user?.name || session?.user?.email}
                </span>
              </p>
              <p className="mb-1">
                Session expires:{" "}
                <span className="font-semibold">{session?.expires}</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">
              Authentication Actions
            </h2>

            {status === "authenticated" ? (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/test" })}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() =>
                  signIn("linkedin", { callbackUrl: "/auth/test" })
                }
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In with LinkedIn
              </button>
            )}
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Navigation Tests</h2>
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
              >
                Go to Home Page
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
              >
                Go to Sign In Page
              </Link>
              <Link
                href="/auth/error?error=OAuthCallback"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
              >
                Test Error Page
              </Link>
            </div>
          </div>
        </div>

        {/* Session Data Debug */}
        {sessionData && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Session Data</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Information */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Troubleshooting</h2>
          <p className="text-sm text-gray-600 mb-4">
            If you're experiencing authentication issues, try the following:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            <li>Clear your browser cookies and cache</li>
            <li>Check browser console for errors</li>
            <li>
              Verify that your LinkedIn Developer application is properly
              configured
            </li>
            <li>
              Ensure the callback URL in your LinkedIn app matches your
              application's callback URL
            </li>
            <li>Check that your environment variables are correctly set</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
