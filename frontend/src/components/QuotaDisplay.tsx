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
      <div className="flex items-center justify-center p-4" data-oid="tr2b3me">
        <ReloadIcon className="h-5 w-5 animate-spin mr-2" data-oid="p8awves" />
        <span data-oid="p_x4ad1">Loading quota information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4" data-oid="mrm_iw5">
        <AlertTitle data-oid="h05xqu4">Error</AlertTitle>
        <AlertDescription data-oid="._hpw_.">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quota) {
    return (
      <Alert className="mb-4" data-oid="q-tdrfb">
        <InfoCircledIcon className="h-4 w-4 mr-2" data-oid="7_2-7s_" />
        <AlertTitle data-oid="omg0fag">
          No quota information available
        </AlertTitle>
        <AlertDescription data-oid="-ejjrnu">
          Your search quota information couldn&apos;t be loaded.
          <button
            onClick={() => refreshQuota()}
            className="underline ml-2"
            data-oid="sihris-"
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
    <div className="p-4 border rounded-lg shadow-sm bg-card" data-oid="9gq-2xf">
      <div className="flex justify-between mb-2" data-oid="1:p2vzw">
        <h3 className="font-medium" data-oid="6h6shf6">
          Search Quota
        </h3>
        <button
          onClick={() => refreshQuota()}
          className="text-xs text-muted-foreground hover:text-primary flex items-center"
          data-oid="j49s.mi"
        >
          <ReloadIcon className="h-3 w-3 mr-1" data-oid="y20c55n" />
          Refresh
        </button>
      </div>

      <Progress
        value={usagePercentage}
        className="h-2 mb-2"
        data-oid="eg4wk81"
      />

      <div className="flex justify-between text-sm" data-oid="8.:f9y4">
        <span data-oid="w94oz_2">
          {quota.searches_this_month} / {quota.monthly_search_limit} searches
          used
        </span>
        <span
          className={limitReached ? "text-destructive font-medium" : ""}
          data-oid="f6r37sz"
        >
          {limitReached ? "Limit reached" : `${remaining} remaining`}
        </span>
      </div>

      {resetDate && (
        <p className="text-xs text-muted-foreground mt-2" data-oid="0l2fian">
          Resets on {formatDate(resetDate)}
        </p>
      )}

      {limitReached && (
        <Alert variant="destructive" className="mt-4" data-oid="rr5nxry">
          <AlertTitle data-oid="0z4q-xr">Search Limit Reached</AlertTitle>
          <AlertDescription data-oid="_1dymua">
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
