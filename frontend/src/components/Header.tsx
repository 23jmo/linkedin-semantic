"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaUser, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import SignIn from "./sign-in";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center"
            >
              <h1 className="text-xl font-bold text-blue-600">
                LinkedIn Semantic Search
              </h1>
            </Link>
          </div>

          <div className="flex items-center">
            {status === "authenticated" ? (
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={toggleMenu}
                    className="flex items-center max-w-xs bg-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    {session?.user?.image ? (
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={session?.user?.image}
                        alt=""
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FaUser className="text-blue-600" />
                      </div>
                    )}
                    <span className="ml-2 text-gray-700">
                      {session?.user?.name}
                    </span>
                    <FaChevronDown className="ml-1 text-gray-400" />
                  </button>
                </div>

                {menuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <SignIn />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
