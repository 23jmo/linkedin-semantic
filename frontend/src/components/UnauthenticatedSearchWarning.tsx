"use client";

import Link from "next/link";
import { FaLock, FaLinkedin } from "react-icons/fa";

export default function UnauthenticatedSearchWarning() {
  return (
    <div className="w-full bg-white p-8 rounded-lg shadow-md text-center">
      <div className="flex justify-center mb-4">
        <FaLock
          className="text-blue-600"
          size={48}
        />
      </div>
      <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
      <p className="text-gray-600 mb-6">
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
