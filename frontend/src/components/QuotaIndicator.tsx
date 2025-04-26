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
    <div className="text-right text-xs text-gray-500 dark:text-gray-400 pr-1 mb-4">
      {isLoading ? (
        <span>Loading quota...</span>
      ) : quota &&
        typeof quota.searches_this_month === "number" && // Check if searches_this_month is a number
        typeof quota.monthly_search_limit === "number" ? ( // Check if monthly_search_limit is a number
        <span>
          Searches used: {quota.searches_this_month} /
          {quota.monthly_search_limit}
        </span>
      ) : (
        // Display N/A if quota is null, or if the required fields are missing or not numbers
        <span>Quota N/A</span>
      )}
    </div>
  );
}
