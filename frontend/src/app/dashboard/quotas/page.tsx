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
    // usage: emailUsage,
    // quotaError: emailError,
  } = useEmailLimits();

  const {
    refreshQuota,
    isLoading: isCheckingSearch,
    // quota: searchUsage,
    // error: searchError,
    // limitReached: searchLimitReached,
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
    <div className="container mx-auto px-4 py-8" data-oid="sjjfn96">
      <div
        className="flex justify-between items-center mb-8"
        data-oid="fm_pf_a"
      >
        <h1 className="text-2xl font-bold" data-oid="x_ivzk8">
          Usage Quotas
        </h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isCheckingEmail || isCheckingSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          data-oid="_9-mui:"
        >
          {isLoading ? "Refreshing..." : "Refresh Quotas"}
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-2" data-oid="jlmr:x8">
        {/* Email Quota Card */}
        <div data-oid="j7dtcsq">
          <QuotaDisplay data-oid="v1ak-3m" />
        </div>

        {/* Search Quota Card */}
        <div data-oid="pkijz00">
          <QuotaDisplay data-oid="r35sl64" />
        </div>
      </div>

      <div
        className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg"
        data-oid="p0btlap"
      >
        <h2 className="text-xl font-semibold mb-4" data-oid="wr4iqgx">
          About Your Quotas
        </h2>
        <p className="mb-4" data-oid="xthy3gy">
          Your quotas reset automatically on the 1st of each month. Usage limits
          depend on your subscription plan.
        </p>
        <h3 className="text-lg font-semibold mt-6 mb-2" data-oid="4kdhsmn">
          Need Higher Limits?
        </h3>
        <p data-oid="zr2w4b7">
          Upgrade your plan to increase your monthly quotas for both email
          generation and searches.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          data-oid="4u5_y2z"
        >
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}
