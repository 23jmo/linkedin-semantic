"use client";

import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

const loadingMessages = [
  "Searching your professional network...",
  "Analyzing connections...",
  "Finding the most relevant profiles...",
  "Matching skills and experiences...",
  "Finding matches in your network...",
  "Discovering 3 potential matches...",
  "Found 5 connections that match your query...",
  "Preparing results...",
];

export default function LoadingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } w-full mx-auto p-8 rounded-lg shadow-md text-center border`}
    >
      <div className="flex flex-col items-center justify-center">
        <FaSpinner
          className={`${
            resolvedTheme === "light" ? "text-blue-600" : "text-blue-400"
          } text-4xl animate-spin mb-4`}
        />
        <h2
          className={`text-xl font-bold mb-2 ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
        >
          {loadingMessages[messageIndex]}
        </h2>
        <p
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          }`}
        >
          This may take a moment...
        </p>
      </div>
    </div>
  );
}
