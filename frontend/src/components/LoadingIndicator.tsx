"use client";

import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import styles from "@/app/search/shimmer.module.css";

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
      data-oid="b:5hals"
    >
      <div
        className="flex flex-col items-center justify-center"
        data-oid="k-2ic0x"
      >
        <FaSpinner
          className={`${
            resolvedTheme === "light" ? "text-blue-600" : "text-blue-400"
          } text-4xl animate-spin mb-4`}
          data-oid="gwd2c8n"
        />

        <h2
          className={`text-xl font-bold mb-2 ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          } ${styles["shimmer-text"]}`}
          data-oid="xrp2l5_"
        >
          {loadingMessages[messageIndex]}
        </h2>
        <p
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          }`}
          data-oid="4:sp40p"
        >
          This may take a moment...
        </p>
      </div>
    </div>
  );
}
