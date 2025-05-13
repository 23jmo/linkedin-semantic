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
      data-oid="tym10.9"
    >
      <div
        className="flex flex-col items-center justify-center"
        data-oid="v8u-pcr"
      >
        <div
          className={`${
            resolvedTheme === "light"
              ? "bg-gray-100 text-gray-400"
              : "bg-gray-700 text-gray-500"
          } w-16 h-16 rounded-full flex items-center justify-center mb-4`}
          data-oid="2rxcp1e"
        >
          <FaSearch className="text-2xl" data-oid="ggyc5:c" />
        </div>
        <h2
          className={`text-xl font-bold mb-2 ${
            resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
          }`}
          data-oid="tp-wnxe"
        >
          No results found for &quot;{query}&quot;
        </h2>
        <p
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          } mb-4`}
          data-oid="yxqlldv"
        >
          We couldn&apos;t find any profiles matching your search.
        </p>
        <div
          className={`${
            resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
          }`}
          data-oid="bwqtomg"
        >
          <p className="mb-2" data-oid="cb76i2v">
            Try:
          </p>
          <ul className="list-disc text-left inline-block" data-oid="lyt8na8">
            <li data-oid="ut5eywa">Checking your spelling</li>
            <li data-oid="fbt-h5d">Using more general keywords</li>
            <li data-oid="k65ip-k">Trying different search terms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
