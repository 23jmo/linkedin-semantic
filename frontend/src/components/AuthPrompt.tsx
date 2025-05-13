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
      data-oid=":e64c1x"
    >
      <p className="text-lg font-medium mb-4" data-oid="lnhkzaf">
        Please sign in to search your network
      </p>
      <div className="flex justify-center" data-oid="wyze8y7">
        <SignIn className="w-3/4" data-oid="y..nz90" />
      </div>
    </div>
  );
}
