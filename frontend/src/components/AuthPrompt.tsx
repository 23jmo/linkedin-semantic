"use client";

import { FaLinkedin } from "react-icons/fa";
import { auth, signIn } from "@/auth";
import SignIn from "./sign-in";
import { useTheme } from "@/lib/theme-context";

export default function AuthPrompt() {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={`w-full ${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } p-6 rounded-lg shadow-md text-center border`}
    >
      <SignIn />
    </div>
  );
}
