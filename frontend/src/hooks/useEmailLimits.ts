import { useState, useCallback } from "react";

interface EmailUsage {
  used: number;
  limit: number;
  remaining: number;
}

interface UseEmailLimitsReturn {
  checkCanGenerateEmail: () => Promise<boolean>;
  isChecking: boolean;
  usage: EmailUsage | null;
  quotaError: string | null;
}

export function useEmailLimits(): UseEmailLimitsReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [usage, setUsage] = useState<EmailUsage | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const checkCanGenerateEmail = useCallback(async () => {
    setIsChecking(true);
    setQuotaError(null);

    try {
      const response = await fetch("/api/quotas/email-gen");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check email limits");
      }

      setUsage(data.usage);
      return data.canSend;
    } catch (err) {
      setQuotaError(
        err instanceof Error ? err.message : "Failed to check email limits"
      );
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { checkCanGenerateEmail, isChecking, usage, quotaError };
}
