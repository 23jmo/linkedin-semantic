"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchLimits } from "@/hooks/useSearchLimits";
import { useReferralStats } from "@/hooks/useReferralStats";
import Layout from "@/components/Layout";
import UnauthenticatedSearchWarning from "@/components/UnauthenticatedSearchWarning";
import SelectionChip from "@/components/SelectionChip";
import EmailComposer from "@/components/EmailComposer";
import LoadingIndicator from "@/components/LoadingIndicator";
import ThinkingProcess, { ThinkingStep } from "@/components/ThinkingProcess";
import SearchControls from "@/components/SearchControls";
import SearchResults from "@/components/SearchResults";
import QuotaIndicator from "@/components/QuotaIndicator";
import QuotaLimitError from "@/components/QuotaLimitError";
import { ProfileFrontend, SearchLimits } from "../../types/types";
import { SearchResult } from "../../types/types";
import { initiateGmailAuth } from "@/lib/gmail-service";

export default function SearchPage() {
  return (
    <Suspense
      fallback={<LoadingIndicator data-oid="8:3w_w6" />}
      data-oid="2ga5_-p"
    >
      <SearchPageContent data-oid=":4ivf_n" />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuotaLimitError, setShowQuotaLimitError] =
    useState<boolean>(false);
  const [gmailAuthError, setGmailAuthError] = useState<string | null>(null);
  const [isReAuthLoading, setIsReAuthLoading] = useState<boolean>(false);

  // Get quota management functions and state
  const {
    incrementUsage,
    error: quotaError,
    quota,
    isLoading: quotaLoading,
  } = useSearchLimits();

  // Fetch referral stats
  const { stats: referralStats } = useReferralStats();

  // Create refs for state variables used in performSearch but shouldn't trigger its recreation
  const errorRef = useRef(error);
  const loadingRef = useRef(loading);
  const quotaErrorRef = useRef(quotaError);

  // Update refs when state changes
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    quotaErrorRef.current = quotaError;
  }, [quotaError]);

  // State for selected profiles
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileFrontend[]>(
    [],
  );
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  // Thinking step states
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setError(null);
      setShowQuotaLimitError(false);
      setResults([]);
      setThinkingSteps([]);

      // --- Increment Usage and Check Limit ---
      let canSearch = false;
      try {
        canSearch = await incrementUsage();
      } catch (incError) {
        // Error during increment call itself (network etc.)
        console.error("Error calling incrementUsage:", incError);
        setError(
          `Failed to check search quota: ${
            incError instanceof Error ? incError.message : String(incError)
          }`,
        );
        setLoading(false);
        return;
      }

      if (!canSearch) {
        // Instead of setting generic error, show the specific quota limit component
        setShowQuotaLimitError(true);
        setLoading(false);
        return;
      }
      // --- End Increment Usage Check ---

      // --- Proceed with Search Fetch ---
      try {
        const controller = new AbortController();
        const signal = controller.signal;

        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
          }),
          signal,
        });

        if (!response.ok) {
          // Handle errors specifically from the search API
          let errorMsg = `Search failed: ${response.status} ${response.statusText}`;
          try {
            const errData = await response.json();
            if (errData.error) {
              errorMsg = `Search failed: ${errData.error}`;
            }
          } catch (e) {
            console.error("Search fetch error:", e);
            // Ignore if response body isn't JSON
          }
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get stream reader");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            const event = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            switch (event) {
              case "step":
                if (data.name && data.status) {
                  setThinkingSteps((prev) => {
                    const existingIndex = prev.findIndex(
                      (step) => step.name === data.name,
                    );
                    if (existingIndex >= 0) {
                      const newSteps = [...prev];
                      newSteps[existingIndex] = data;
                      return newSteps;
                    } else {
                      return [...prev, data];
                    }
                  });
                }
                break;
              case "results":
                setResults(data);
                break;
              case "error":
                setError(data.message); // Error from the backend search stream
                break;
              case "done":
                setLoading(false);
                break;
            }
          }
        }
        // If the loop finished without setting loading to false (no 'done' event)
        if (loadingRef.current) setLoading(false);
      } catch (err) {
        console.error("Search fetch error:", err);
        // Set error state only if it hasn't been set by the stream
        if (!errorRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred during the search.",
          );
        }
        setLoading(false);
      }
    },
    [incrementUsage],
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      if (status === "authenticated") {
        performSearch(q);
      } else {
        setError(null); // Clear errors if user logs out/in
        setResults([]);
        setThinkingSteps([]);
      }
    }
  }, [searchParams, status, performSearch]);

  // Effect to handle Gmail auth errors from URL parameters
  useEffect(() => {
    const authError = searchParams.get("error");
    const reason = searchParams.get("reason");

    if (authError === "gmail_auth_failed") {
      let message = "Failed to connect your Gmail account.";
      switch (reason) {
        case "oauth_error":
          message =
            "There was an error during Google authentication. Please try again.";
          break;
        case "missing_parameters":
          message =
            "Authentication failed due to missing information. Please try again.";
          break;
        case "no_access_token":
          message =
            "Could not retrieve necessary permissions from Google. Please ensure you grant access and try again.";
          break;
        case "server_error":
          message =
            "An unexpected server error occurred during Gmail authentication. Please try again later.";
          break;
      }
      setGmailAuthError(message);
      // Optionally, clear the URL parameters to avoid re-showing the error on refresh
      // window.history.replaceState(null, '', window.location.pathname);
    } else {
      // Clear the error if the parameters are not present
      setGmailAuthError(null);
    }
  }, [searchParams]);

  // Handler for Gmail Re-Authentication Button
  const handleGmailReAuth = async () => {
    setIsReAuthLoading(true);
    setGmailAuthError(null); // Clear the error message
    try {
      const authUrl = await initiateGmailAuth();
      console.log("Redirecting to Gmail auth:", authUrl);
      window.location.href = authUrl;
      // No need to set loading false, page will redirect
    } catch (err) {
      console.error("Failed to initiate Gmail re-auth:", err);
      setGmailAuthError(
        err instanceof Error
          ? err.message
          : "Failed to start Gmail connection.",
      );
      setIsReAuthLoading(false);
    }
  };

  // Handle profile selection
  const handleProfileSelect = (profile: ProfileFrontend, selected: boolean) => {
    if (selected) {
      // Check if we already have 3 profiles selected
      if (selectedProfiles.length >= 3) {
        alert("You can only select up to 3 profiles for cold emailing.");
        return;
      }
      setSelectedProfiles((prev) => [...prev, profile]);
    } else {
      setSelectedProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    }
  };

  // Handle removing a profile from selection
  const handleRemoveProfile = (profileId: string) => {
    setSelectedProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  // Toggle email composer
  const toggleEmailComposer = () => {
    setShowEmailComposer((prev) => !prev);
  };

  return (
    <Layout data-oid="2g8j:ke">
      <div className="py-6 px-3" data-oid="otjj7dn">
        <div className="max-w-4xl mx-auto" data-oid="ha3:uld">
          <h1 className="text-2xl font-bold mb-6" data-oid="36sfh9e">
            Search Results
          </h1>

          {/* Render Gmail Auth Error if present */}
          {gmailAuthError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
              data-oid="mh_yrvg"
            >
              <strong className="font-bold" data-oid="b:xnztn">
                Gmail Connection Error:{" "}
              </strong>
              <span className="block sm:inline" data-oid="1jd6d8r">
                {gmailAuthError}
              </span>
              <div className="mt-2" data-oid=":bivzna">
                <button
                  onClick={handleGmailReAuth}
                  disabled={isReAuthLoading}
                  className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${
                    isReAuthLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  data-oid="ge-y0f."
                >
                  {isReAuthLoading ? "Connecting..." : "Reconnect Gmail"}
                </button>
              </div>
            </div>
          )}

          <SearchControls
            initialQuery={query}
            onSearch={performSearch}
            data-oid="1x4azy_"
          />

          {/* --- Use Quota Indicator Component --- */}
          <QuotaIndicator
            isLoading={quotaLoading}
            quota={quota as SearchLimits | null}
            data-oid="a8nes4f"
          />

          {/* --- End Quota Indicator --- */}

          {status === "unauthenticated" ? (
            <UnauthenticatedSearchWarning data-oid="-71_u7w" />
          ) : (
            <>
              {/* Show thinking steps when available */}
              {thinkingSteps.length > 0 && (
                <ThinkingProcess
                  thinkingSteps={thinkingSteps}
                  data-oid="9a3l.ep"
                />
              )}

              {showQuotaLimitError ? (
                <QuotaLimitError
                  referralCode={referralStats?.referralCode || null}
                  data-oid=":0h81aw"
                />
              ) : loading ? (
                <div className="flex justify-center py-8" data-oid="n:1lueq">
                  <div
                    className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"
                    data-oid="6sp9_38"
                  ></div>
                </div>
              ) : error ? (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
                  data-oid="a74gdr7"
                >
                  {error}
                </div>
              ) : (
                <SearchResults
                  results={results}
                  query={query}
                  selectedProfiles={selectedProfiles}
                  onProfileSelect={handleProfileSelect}
                  data-oid="2pju_iv"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Selection chip */}
      <SelectionChip
        count={selectedProfiles.length}
        onClick={toggleEmailComposer}
        data-oid="zrrxznm"
      />

      {/* Email composer modal */}
      {showEmailComposer && (
        <EmailComposer
          selectedProfiles={selectedProfiles}
          onClose={toggleEmailComposer}
          onRemoveProfile={handleRemoveProfile}
          data-oid="dwu.0wz"
        />
      )}
    </Layout>
  );
}
