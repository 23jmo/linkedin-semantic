"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ReferralStats {
  referralCode: string | null;
  referralCount: number;
}

export function useReferralStats() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      // Only fetch if authenticated and stats are not already loaded
      if (status === "authenticated" && session?.user?.id) {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/referrals/stats");
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              `Failed to fetch referral stats: ${res.status} ${
                errorData.error || ""
              }`
            );
          }
          const data = await res.json();
          setStats(data);
        } catch (err) {
          console.error("Error fetching referral stats:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Could not load referral information."
          );
          setStats(null); // Clear stats on error
        } finally {
          setIsLoading(false);
        }
      } else if (status === "unauthenticated") {
        // If user logs out, clear stats and loading state
        setStats(null);
        setIsLoading(false);
        setError(null);
      }
      // If status is 'loading', we wait for authentication status
    }
    fetchStats();
  }, [session?.user?.id, status]); // Depend on user ID and auth status

  return { stats, isLoading, error };
}
