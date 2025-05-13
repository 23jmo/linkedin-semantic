"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import {
  FaUser,
  FaSignOutAlt,
  FaChevronDown,
  FaSun,
  FaMoon,
  FaChartBar,
} from "react-icons/fa";
import SignIn from "./sign-in";
import { useTheme } from "@/lib/theme-context";

export default function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [headerKey, setHeaderKey] = useState(0);

  useEffect(() => {
    // Force a re-render of the header when theme changes
    setHeaderKey((prev) => prev + 1);
  }, [resolvedTheme]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header
      key={headerKey}
      className={`${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } shadow-sm sticky top-0 z-100 border-b`}
      data-oid="29f93:m"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        data-oid="skdiuje"
      >
        <div className="flex justify-between h-16" data-oid="esuc4i8">
          <div
            className="flex items-center justify-center space-x-8"
            data-oid="28-ew6b"
          >
            <Link
              href="/"
              className="flex items-center justify-center"
              data-oid="f8i30-x"
            >
              <Image
                src="/LogoBlack.png"
                alt="LockedIn"
                width={48}
                height={48}
                data-oid="unq1r.v"
              />

              <h1
                className={`ml-2 text-xl font-bold ${
                  resolvedTheme === "light" ? "text-gray-900" : "text-white"
                } hidden md:block`}
                data-oid="qery63."
              ></h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4" data-oid="8n.0pt5">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                resolvedTheme === "light"
                  ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              } transition-colors`}
              aria-label={`Switch to ${
                resolvedTheme === "light" ? "dark" : "light"
              } mode`}
              data-oid="3yw6o:k"
            >
              {resolvedTheme === "light" ? (
                <FaMoon data-oid="yz2m.j5" />
              ) : (
                <FaSun data-oid="ctuf262" />
              )}
            </button>

            {status === "authenticated" ? (
              <div className="relative ml-3" ref={menuRef} data-oid="suqmrx-">
                <button
                  onClick={toggleMenu}
                  className={`flex items-center space-x-2 ${
                    resolvedTheme === "light"
                      ? "bg-white hover:bg-gray-50 border-gray-200 focus:ring-offset-2"
                      : "bg-gray-800 hover:bg-gray-700 border-gray-700 focus:ring-offset-gray-900"
                  } rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5] p-1 transition-colors duration-200 border`}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  data-oid="oit30w2"
                >
                  <span className="sr-only" data-oid="sgpj67j">
                    Open user menu
                  </span>
                  {session?.user?.image ? (
                    <Image
                      className={`h-8 w-8 rounded-full border ${
                        resolvedTheme === "light"
                          ? "border-gray-200"
                          : "border-gray-600"
                      }`}
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                      data-oid="atsfwcn"
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full bg-[#0077b5] flex items-center justify-center"
                      data-oid="22l6vjo"
                    >
                      <FaUser className="text-white" data-oid="sh4t6lw" />
                    </div>
                  )}
                  <div className="hidden md:block text-left" data-oid="-g72d19">
                    <p
                      className={`text-sm font-medium ${
                        resolvedTheme === "light"
                          ? "text-gray-700"
                          : "text-gray-300"
                      } truncate max-w-[120px]`}
                      data-oid="-hz7a65"
                    >
                      {session?.user?.name}
                    </p>
                    <p
                      className={`text-xs ${
                        resolvedTheme === "light"
                          ? "text-gray-500"
                          : "text-gray-400"
                      } truncate max-w-[120px]`}
                      data-oid="dxn6n0u"
                    >
                      {session?.user?.email}
                    </p>
                  </div>
                  <FaChevronDown
                    className={`${
                      resolvedTheme === "light"
                        ? "text-gray-400"
                        : "text-gray-500"
                    } h-4 w-4`}
                    data-oid="aac1vc2"
                  />
                </button>

                {menuOpen && (
                  <div
                    className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                      resolvedTheme === "light"
                        ? "bg-white ring-black ring-opacity-5 border-gray-100"
                        : "bg-gray-800 ring-opacity-10 border-gray-700"
                    } ring-1 focus:outline-none border`}
                    data-oid="y91c7jm"
                  >
                    <div
                      className={`px-4 py-2 border-b ${
                        resolvedTheme === "light"
                          ? "border-gray-100"
                          : "border-gray-700"
                      } md:hidden`}
                      data-oid="qc4a:d6"
                    >
                      <p
                        className={`text-sm font-medium ${
                          resolvedTheme === "light"
                            ? "text-gray-700"
                            : "text-gray-300"
                        } truncate`}
                        data-oid="_7499pw"
                      >
                        {session?.user?.name}
                      </p>
                      <p
                        className={`text-xs ${
                          resolvedTheme === "light"
                            ? "text-gray-500"
                            : "text-gray-400"
                        } truncate`}
                        data-oid=".ukn260"
                      >
                        {session?.user?.email}
                      </p>
                    </div>

                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        resolvedTheme === "light"
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 hover:bg-gray-700"
                      } flex items-center`}
                      data-oid="3jngfaj"
                    >
                      <FaChartBar
                        className={`mr-2 ${
                          resolvedTheme === "light"
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                        data-oid="k2:b5r4"
                      />
                      Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        resolvedTheme === "light"
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 hover:bg-gray-700"
                      } flex items-center`}
                      data-oid="j_y387-"
                    >
                      <FaSignOutAlt
                        className={`mr-2 ${
                          resolvedTheme === "light"
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                        data-oid="mhebe3j"
                      />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <SignIn data-oid="rx7azi0" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
