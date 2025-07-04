"use client";

import SignIn from "./sign-in";
import { useTheme } from "@/lib/theme-context";

export default function AuthPrompt() {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={`w-full flex-col items-center justify-center ${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } p-6 rounded-lg shadow-md text-center border`}
    >
      <p className="text-lg font-medium mb-4">
        Please sign in to search your network
      </p>
      <div className="flex justify-center">
        <SignIn className="w-3/4" />
      </div>
    </div>
  );
}
