"use client";

import { FaSearch } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

interface NoResultsProps {
  query: string;
}

export default function NoResults({ query }: NoResultsProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={`${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } w-full max-w-3xl mx-auto p-8 rounded-lg shadow-md text-center border`}
      data-oid="vx2_.az"
    >
      <div
        className="flex flex-col items-center justify-center"
        data-oid="gqblm-x"
      >
        <div
          className={`${
            resolvedTheme === "light"
              ? "bg-gray-100 text-gray-400"
              : "bg-gray-700 text-gray-500"
          } w-16 h-16 rounded-full flex items-center justify-center mb-4`}
          data-oid="vn0dvhz"
        >
          <FaSearch className="text-2xl" data-oid="0jqntf3" />
        </div>
        <h2
          className={`text-xl font-bold mb-2 ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
          data-oid="za0s4wb"
        >
          No results found for &quot;{query}&quot;
        </h2>
        <p
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          } mb-4`}
          data-oid="cp5w4gk"
        >
          We couldn&apos;t find any profiles matching your search.
        </p>
        <div
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          }`}
          data-oid="yd9dwa:"
        >
          <p className="mb-2" data-oid="t-47jcq">
            Try:
          </p>
          <ul className="list-disc text-left inline-block" data-oid="d5mzz14">
            <li data-oid="74ic:lf">Checking your spelling</li>
            <li data-oid="0m4r.87">Using more general keywords</li>
            <li data-oid="9cyt.e-">Trying different search terms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
