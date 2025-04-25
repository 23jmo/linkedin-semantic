import React from "react";
import { useSearchLimits } from "@/hooks/useSearchLimits";
import { formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoCircledIcon, ReloadIcon } from "@radix-ui/react-icons";

/**
 * Component for displaying search quota information
 */
export function QuotaDisplay() {
  const { isLoading, quota, limitReached, error, refreshQuota } =
    useSearchLimits();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4" data-oid="1mw02k.">
        <ReloadIcon className="h-5 w-5 animate-spin mr-2" data-oid="2k0:fst" />
        <span data-oid="7ja_xco">Loading quota information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4" data-oid="t3dtcq2">
        <AlertTitle data-oid=".tfuc9u">Error</AlertTitle>
        <AlertDescription data-oid="et5yj_-">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quota) {
    return (
      <Alert className="mb-4" data-oid="nuob9_k">
        <InfoCircledIcon className="h-4 w-4 mr-2" data-oid="snibgfo" />
        <AlertTitle data-oid="ukcnn76">
          No quota information available
        </AlertTitle>
        <AlertDescription data-oid=".zyp9:g">
          Your search quota information couldn&apos;t be loaded.
          <button
            onClick={() => refreshQuota()}
            className="underline ml-2"
            data-oid="z1wvnd3"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  const usagePercentage = Math.min(
    100,
    Math.round((quota.searches_this_month / quota.monthly_search_limit) * 100),
  );
  const remaining = Math.max(
    0,
    quota.monthly_search_limit - quota.searches_this_month,
  );
  const resetDate = quota.last_reset_date
    ? new Date(quota.last_reset_date)
    : null;

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-card" data-oid="ufumyzf">
      <div className="flex justify-between mb-2" data-oid="sf4tcw8">
        <h3 className="font-medium" data-oid="lgr9u8q">
          Search Quota
        </h3>
        <button
          onClick={() => refreshQuota()}
          className="text-xs text-muted-foreground hover:text-primary flex items-center"
          data-oid="e7:7n-_"
        >
          <ReloadIcon className="h-3 w-3 mr-1" data-oid="1m_mzz0" />
          Refresh
        </button>
      </div>

      <Progress
        value={usagePercentage}
        className="h-2 mb-2"
        data-oid="bd0kvv9"
      />

      <div className="flex justify-between text-sm" data-oid="g4hr2d3">
        <span data-oid="36itmh1">
          {quota.searches_this_month} / {quota.monthly_search_limit} searches
          used
        </span>
        <span
          className={limitReached ? "text-destructive font-medium" : ""}
          data-oid="gd7k72o"
        >
          {limitReached ? "Limit reached" : `${remaining} remaining`}
        </span>
      </div>

      {resetDate && (
        <p className="text-xs text-muted-foreground mt-2" data-oid="s:t5m6h">
          Resets on {formatDate(resetDate)}
        </p>
      )}

      {limitReached && (
        <Alert variant="destructive" className="mt-4" data-oid="vt2cq_1">
          <AlertTitle data-oid="mb3ltjn">Search Limit Reached</AlertTitle>
          <AlertDescription data-oid="m8d5yth">
            You&apos;ve reached your search quota limit for this period. Your
            quota will reset on{" "}
            {resetDate ? formatDate(resetDate) : "the next billing cycle"}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default QuotaDisplay;
