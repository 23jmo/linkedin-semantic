"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { FaGoogle, FaCheck } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

export default function GmailConnector() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    async function checkGmailConnection() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/gmail/check-connection");
          if (response.ok) {
            const data = await response.json();
            setIsConnected(data.isConnected);
          } else {
            setIsConnected(false);
          }
        } catch (error) {
          console.error("Error checking Gmail connection:", error);
          setIsConnected(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    checkGmailConnection();
  }, [session]);

  const handleConnect = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

  if (isLoading) {
    return (
      <div
        className={`mb-6 p-4 border rounded-lg ${
          resolvedTheme === "light" ? "border-gray-200" : "border-gray-700"
        }`}
      >
        <h3
          className={`text-lg font-medium mb-2 ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
        >
          Email Connection
        </h3>
        <p
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          }`}
        >
          Checking connection status...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mb-6 p-4 border rounded-lg ${
        resolvedTheme === "light" ? "border-gray-200" : "border-gray-700"
      }`}
    >
      <h3
        className={`text-lg font-medium mb-2 ${
          resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
        }`}
      >
        Email Connection
      </h3>

      {isConnected ? (
        <div className="flex items-center text-green-600">
          <FaCheck className="mr-2" />
          <span>Gmail connected</span>
        </div>
      ) : (
        <div>
          <p
            className={`mb-3 ${
              resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
            }`}
          >
            Connect your Gmail account to send cold emails directly from the
            app.
          </p>
          <button
            onClick={handleConnect}
            className={`flex items-center px-4 py-2 rounded-lg ${
              resolvedTheme === "light"
                ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                : "bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600"
            }`}
          >
            <FaGoogle className="mr-2 text-red-500" />
            Connect Gmail
          </button>
        </div>
      )}
    </div>
  );
}
