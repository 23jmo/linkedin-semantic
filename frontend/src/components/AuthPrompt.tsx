import Link from "next/link";
import { FaLinkedin } from "react-icons/fa";

export default function AuthPrompt() {
  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md text-center">
      <p className="text-lg mb-4">
        Sign in with LinkedIn to search your professional network
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
