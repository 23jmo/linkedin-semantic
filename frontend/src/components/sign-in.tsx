"use client";

import { FaLinkedin } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { useTheme } from "@/lib/theme-context";

export default function SignIn() {
  const { resolvedTheme } = useTheme();

  const handleSignIn = async () => {
    await signIn("linkedin", { callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignIn}
      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-white ${
        resolvedTheme === "light"
          ? "bg-[#0077b5] hover:bg-[#0066a1]"
          : "bg-[#0077b5]/90 hover:bg-[#0077b5]"
      } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077b5] ${
        resolvedTheme === "light"
          ? "focus:ring-offset-white"
          : "focus:ring-offset-gray-800"
      }`}
    >
      <FaLinkedin className="h-5 w-5" />
      <span>Sign in</span>
    </button>
  );
}
