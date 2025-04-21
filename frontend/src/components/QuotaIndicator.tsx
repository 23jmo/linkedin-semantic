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
      ) : quota ? (
        <span>
          Searches used: {quota.searches_this_month} /
          {quota.monthly_search_limit}
        </span>
      ) : (
        // Display something if quota is null and not loading (e.g., error occurred)
        // Could use quotaError prop here if passed
        <span>Quota N/A</span>
      )}
    </div>
  );
}
