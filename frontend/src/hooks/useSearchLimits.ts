import { useState, useEffect, useCallback } from "react";
import { QuotaResponse, SearchLimitsData } from "@/types/quota";

interface UseSearchLimitsReturn {
  isLoading: boolean;
  quota: SearchLimitsData | null;
  limitReached: boolean;
  error: string | null;
  incrementUsage: () => Promise<boolean>;
  refreshQuota: () => Promise<void>;
}

/**
 * Custom hook to manage and track search quota usage
 *
 * @returns Object containing search quota information and management functions
 */
export function useSearchLimits(): UseSearchLimitsReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quota, setQuota] = useState<SearchLimitsData | null>(null);
  const [limitReached, setLimitReached] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the current quota from the API
   */
  const refreshQuota = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/quotas/search");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error fetching quota: ${response.status} ${response.statusText} ${
            errorData.error || ""
          }`
        );
      }

      const data = (await response.json()) as QuotaResponse;

      setQuota(data.quota);
      setLimitReached(data.limitReached);
      setError(data.error);
    } catch (err) {
      console.error("Failed to fetch quota:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load quota information"
      );
      setQuota(null);
      setLimitReached(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Increments the usage count
   * Returns true if successful, false if limit reached or error
   */
  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (limitReached) {
      return false;
    }

    try {
      setError(null);
      const response = await fetch("/api/quotas/search", {
        method: "POST",
      });

      const data = (await response.json().catch(() => ({}))) as QuotaResponse;

      if (!response.ok || data.error) {
        if (response.status === 403 && data.limitReached) {
          setLimitReached(true);
          setError(data.error || "Search limit reached.");
          return false;
        }
        console.error(
          "Failed to increment usage:",
          data.error || `HTTP ${response.status}`
        );
        setError(data.error || "Failed to update quota usage");
        return false;
      }

      await refreshQuota();

      return true;
    } catch (err) {
      console.error("Error during usage increment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update quota usage"
      );
      return false;
    }
  }, [refreshQuota]);

  // Load quota on initial mount
  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  return {
    isLoading,
    quota,
    limitReached,
    error,
    incrementUsage,
    refreshQuota,
  };
}

export default useSearchLimits;
