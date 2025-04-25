"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FaGoogle, FaCheck } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import { hasGmailConnected, initiateGmailAuth } from "@/lib/gmail-service";

export default function GmailConnector() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { resolvedTheme } = useTheme();

  const checkGmailConnection = useCallback(async () => {
    if (session?.user?.id) {
      try {
        setIsLoading(true);
        const connected = await hasGmailConnected();
        setIsConnected(connected);
      } catch (error) {
        console.error("Error checking Gmail connection:", error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Check for success or error parameters in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");

    if (success === "gmail_connected") {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh the connection status
      checkGmailConnection();
    } else if (error) {
      console.error(
        `Gmail connection error: ${error}, reason: ${urlParams.get("reason")}`,
      );
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [checkGmailConnection]);

  useEffect(() => {
    checkGmailConnection();
  }, [checkGmailConnection]);

  const handleConnect = async () => {
    if (!session?.user?.id) {
      console.error("User not authenticated");
      return;
    }

    setIsConnecting(true);
    try {
      // Get current path to return to after auth
      const currentPath = window.location.pathname + window.location.search;
      console.log(`Initiating Gmail auth, will return to: ${currentPath}`);

      // Use the initiateGmailAuth function from gmail-service
      const authUrl = await initiateGmailAuth();

      // Redirect to Google's OAuth page
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`mb-6 p-4 border rounded-lg ${
          resolvedTheme === "light" ? "border-gray-200" : "border-gray-700"
        }`}
        data-oid="mlq2isk"
      >
        <h3
          className={`text-lg font-medium mb-2 ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
          data-oid="pt.1hzi"
        >
          Email Connection
        </h3>
        <p
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          }`}
          data-oid="up0muxp"
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
      data-oid="n6y1e-y"
    >
      <h3
        className={`text-lg font-medium mb-2 ${
          resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
        }`}
        data-oid="7yl7t9c"
      >
        Email Connection
      </h3>

      {isConnected ? (
        <div className="flex items-center text-green-600" data-oid="-u-bk3h">
          <FaCheck className="mr-2" data-oid="4kn8z4_" />
          <span data-oid="kc_2p3z">Gmail connected</span>
        </div>
      ) : (
        <div data-oid="jwhapy4">
          <p
            className={`mb-3 ${
              resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
            }`}
            data-oid="gmypn5i"
          >
            Connect your Gmail account to send cold emails directly from the
            app.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isConnecting ? "opacity-70 cursor-not-allowed" : ""
            } ${
              resolvedTheme === "light"
                ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                : "bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600"
            }`}
            data-oid="52q9by."
          >
            <FaGoogle className="mr-2 text-red-500" data-oid="vh2s5n0" />
            {isConnecting ? "Connecting..." : "Connect Gmail"}
          </button>
        </div>
      )}
    </div>
  );
}
