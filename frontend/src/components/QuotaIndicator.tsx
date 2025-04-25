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
      data-oid="3v1r_-."
    >
      {isLoading ? (
        <span data-oid="pn2tyf.">Loading quota...</span>
      ) : quota &&
        typeof quota.searches_this_month === "number" && // Check if searches_this_month is a number
        typeof quota.monthly_search_limit === "number" ? ( // Check if monthly_search_limit is a number
        <span data-oid="21o93zt">
          Searches used: {quota.searches_this_month} /
          {quota.monthly_search_limit}
        </span>
      ) : (
        // Display N/A if quota is null, or if the required fields are missing or not numbers
        <span data-oid="4dq52m0">Quota N/A</span>
      )}
    </div>
  );
}
