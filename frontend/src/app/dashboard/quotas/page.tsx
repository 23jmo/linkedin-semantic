"use client";

import { useState, useEffect } from "react";
import { useEmailLimits } from "@/hooks/useEmailLimits";
import { useSearchLimits } from "@/hooks/useSearchLimits";
import QuotaDisplay from "@/components/QuotaDisplay";

export default function QuotasDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Use both quota hooks
  const {
    checkCanGenerateEmail,
    isChecking: isCheckingEmail,
    usage: emailUsage,
    quotaError: emailError,
  } = useEmailLimits();

  const {
    refreshQuota,
    isLoading: isCheckingSearch,
    quota: searchUsage,
    error: searchError,
    limitReached: searchLimitReached,
  } = useSearchLimits();

  // Load all quotas on page mount
  useEffect(() => {
    async function loadAllQuotas() {
      setIsLoading(true);

      // Check all quotas in parallel
      await Promise.all([checkCanGenerateEmail(), refreshQuota()]);

      setIsLoading(false);
    }

    loadAllQuotas();
  }, [checkCanGenerateEmail, refreshQuota]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([checkCanGenerateEmail(), refreshQuota()]);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Usage Quotas</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isCheckingEmail || isCheckingSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? "Refreshing..." : "Refresh Quotas"}
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Email Quota Card */}
        <div>
          <QuotaDisplay />
        </div>

        {/* Search Quota Card */}
        <div>
          <QuotaDisplay />
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">About Your Quotas</h2>
        <p className="mb-4">
          Your quotas reset automatically on the 1st of each month. Usage limits
          depend on your subscription plan.
        </p>
        <h3 className="text-lg font-semibold mt-6 mb-2">Need Higher Limits?</h3>
        <p>
          Upgrade your plan to increase your monthly quotas for both email
          generation and searches.
        </p>
        <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}
 