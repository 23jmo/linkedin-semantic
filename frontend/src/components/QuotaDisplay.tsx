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
      <div className="flex items-center justify-center p-4">
        <ReloadIcon className="h-5 w-5 animate-spin mr-2" />
        <span>Loading quota information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="mb-4"
      >
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quota) {
    return (
      <Alert className="mb-4">
        <InfoCircledIcon className="h-4 w-4 mr-2" />
        <AlertTitle>No quota information available</AlertTitle>
        <AlertDescription>
          Your search quota information couldn't be loaded.
          <button
            onClick={() => refreshQuota()}
            className="underline ml-2"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  const usagePercentage = Math.min(
    100,
    Math.round((quota.searches_this_month / quota.monthly_search_limit) * 100)
  );
  const remaining = Math.max(
    0,
    quota.monthly_search_limit - quota.searches_this_month
  );
  const resetDate = quota.last_reset_date
    ? new Date(quota.last_reset_date)
    : null;

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-card">
      <div className="flex justify-between mb-2">
        <h3 className="font-medium">Search Quota</h3>
        <button
          onClick={() => refreshQuota()}
          className="text-xs text-muted-foreground hover:text-primary flex items-center"
        >
          <ReloadIcon className="h-3 w-3 mr-1" />
          Refresh
        </button>
      </div>

      <Progress
        value={usagePercentage}
        className="h-2 mb-2"
      />

      <div className="flex justify-between text-sm">
        <span>
          {quota.searches_this_month} / {quota.monthly_search_limit} searches
          used
        </span>
        <span className={limitReached ? "text-destructive font-medium" : ""}>
          {limitReached ? "Limit reached" : `${remaining} remaining`}
        </span>
      </div>

      {resetDate && (
        <p className="text-xs text-muted-foreground mt-2">
          Resets on {formatDate(resetDate)}
        </p>
      )}

      {limitReached && (
        <Alert
          variant="destructive"
          className="mt-4"
        >
          <AlertTitle>Search Limit Reached</AlertTitle>
          <AlertDescription>
            You've reached your search quota limit for this period. Your quota
            will reset on{" "}
            {resetDate ? formatDate(resetDate) : "the next billing cycle"}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default QuotaDisplay;
