"use client";

import { FaLinkedin } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { useTheme } from "@/lib/theme-context";

/**
 * @param className - Additional classes for positioning/spacing the button
 */
export default function SignIn({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  const handleSignIn = async () => {
    await signIn("linkedin", { callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignIn}
      className={`${
        className || ""
      } flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-white ${
        resolvedTheme === "light"
          ? "bg-[#0077b5] hover:bg-[#0066a1]"
          : "bg-[#0077b5]/90 hover:bg-[#0077b5]"
      } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077b5] ${
        resolvedTheme === "light"
          ? "focus:ring-offset-white"
          : "focus:ring-offset-gray-800"
      }`}
      data-oid="iy7syg8"
    >
      <FaLinkedin className="h-5 w-5" data-oid="mmftfrv" />
      <span data-oid=".epm1kj">Sign in</span>
    </button>
  );
}
