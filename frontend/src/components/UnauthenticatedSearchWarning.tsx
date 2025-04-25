"use client";

import { FaLock } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import SignIn from "./sign-in";

export default function UnauthenticatedSearchWarning() {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={`w-full ${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } p-8 rounded-lg shadow-md text-center border`}
      data-oid="obxa5e9"
    >
      <div className="flex justify-center mb-4" data-oid="78e6lsi">
        <FaLock
          className={
            resolvedTheme === "light" ? "text-blue-600" : "text-blue-400"
          }
          size={48}
          data-oid="ie7pst2"
        />
      </div>
      <h2
        className={`text-2xl font-bold mb-4 ${
          resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
        }`}
        data-oid="k1zhjoh"
      >
        Authentication Required
      </h2>
      <p
        className={`${
          resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
        } mb-6`}
        data-oid="-53k0y_"
      >
        You need to sign in with LinkedIn to search your professional network.
      </p>
      <div className="flex justify-center" data-oid="nsch_-1">
        <SignIn className="w-3/4" data-oid="xs92y8:" />
      </div>
    </div>
  );
}
