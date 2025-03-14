"use client";

import Link from "next/link";
import { FaLock, FaLinkedin } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

export default function UnauthenticatedSearchWarning() {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={`w-full ${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } p-8 rounded-lg shadow-md text-center border`}
    >
      <div className="flex justify-center mb-4">
        <FaLock
          className={
            resolvedTheme === "light" ? "text-blue-600" : "text-blue-400"
          }
          size={48}
        />
      </div>
      <h2
        className={`text-2xl font-bold mb-4 ${
          resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
        }`}
      >
        Authentication Required
      </h2>
      <p
        className={`${
          resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
        } mb-6`}
      >
        You need to sign in with LinkedIn to search your professional network.
      </p>
      <Link
        href="/api/auth/signin"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
      >
        <FaLinkedin
          className="mr-2"
          size={24}
        />
        Sign in with LinkedIn
      </Link>
    </div>
  );
}
