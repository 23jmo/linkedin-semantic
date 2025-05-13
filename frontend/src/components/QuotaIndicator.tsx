"use client";

import React from "react";
import { SearchLimits } from "@/types/types"; // Assuming types are defined here or adjust path

interface QuotaIndicatorProps {
  isLoading: boolean;
  quota: SearchLimits | null;
  // quotaError: string | null; // Optional: Pass error if needed for display
}

export default function QuotaIndicator({
  isLoading,
  quota,
}: QuotaIndicatorProps) {
  return (
    <div
      className="text-right text-xs text-gray-500 dark:text-gray-400 pr-1 mb-4"
      data-oid="xom2b6u"
    >
      {isLoading ? (
        <span data-oid="b87t_ka">Loading quota...</span>
      ) : quota &&
        typeof quota.searches_this_month === "number" && // Check if searches_this_month is a number
        typeof quota.monthly_search_limit === "number" ? ( // Check if monthly_search_limit is a number
        <span data-oid="d1r-a.i">
          Searches used: {quota.searches_this_month} /
          {quota.monthly_search_limit}
        </span>
      ) : (
        // Display N/A if quota is null, or if the required fields are missing or not numbers
        <span data-oid="c2:p3:r">Quota N/A</span>
      )}
    </div>
  );
}
