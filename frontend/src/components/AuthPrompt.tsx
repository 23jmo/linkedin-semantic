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
      data-oid="sn35__q"
    >
      <p className="text-lg font-medium mb-4" data-oid="wacv3hc">
        Please sign in to search your network
      </p>
      <div className="flex justify-center" data-oid=":l2aaya">
        <SignIn className="w-3/4" data-oid="xg749e1" />
      </div>
    </div>
  );
}
