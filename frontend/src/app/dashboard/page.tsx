"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Layout from "@/components/Layout";
import { useTheme } from "@/lib/theme-context";
import { deleteUser } from "@/lib/api";
import EmailHistory from "@/components/EmailHistory";
import { useEmailLimits } from "@/hooks/useEmailLimits";
import EmailQuotaDisplay from "@/components/EmailQuotaDisplay";
import { Card } from "@/components/ui/card";
import { ToastWrapper } from "@/components/providers/ToastWrapper";
import { toast } from "sonner";
import QuotaDisplay from "@/components/QuotaDisplay";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { checkCanGenerateEmail, isChecking, usage, quotaError } =
    useEmailLimits();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(true);
  const [referralLink, setReferralLink] = useState("");
  // const [emailUsage, setEmailUsage] = useState(0);
  // const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  // const [emailError, setEmailError] = useState("");

  useEffect(() => {
    // console.log("DashboardPage - Session status:", status);
    // console.log("DashboardPage - Session data:", session);

    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      console.log(
        "DashboardPage - User is not authenticated, redirecting to home",
      );
      router.push("/");
    } else if (status === "authenticated") {
      console.log("DashboardPage - User is authenticated");
      // If user doesn't exist in the database, redirect to complete-profile
      if (session?.exists === false) {
        console.log(
          "DashboardPage - User does not exist, redirecting to complete-profile",
        );
        router.push("/complete-profile");
      } else {
        console.log("DashboardPage - User exists, showing dashboard");
        setIsLoading(false);
      }
    }
  }, [status, session, router]);

  // New useEffect for checking email quota
  useEffect(() => {
    const fetchQuota = async () => {
      if (status === "authenticated" && !isLoading) {
        await checkCanGenerateEmail();
      }
    };

    fetchQuota();
  }, [status, isLoading, checkCanGenerateEmail]);

  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        const response = await fetch("/api/referrals/get");
        const data = await response.json();
        if (response.ok) {
          setReferralCode(data.referralCode);
        }
      } catch (error) {
        console.error("Failed to fetch referral code:", error);
      } finally {
        setIsLoadingCode(false);
      }
    };

    fetchReferralCode();
  }, []);

  useEffect(() => {
    if (referralCode) {
      setReferralLink(`${window.location.origin}/ref=${referralCode}`);
    }
  }, [referralCode]);

  useEffect(() => {
    const fetchEmailUsage = async () => {
      if (status === "authenticated" && !isLoading) {
        // setIsCheckingEmail(true);
        try {
          const response = await fetch("/api/quotas/email-gen");
          // const data = await response.json();
          if (response.ok) {
            // setEmailUsage(data.usage);
            // setEmailError("");
          }
        } catch (error) {
          console.error("Failed to fetch email usage:", error);
          // setEmailError("Failed to fetch email usage");
        } finally {
          // setIsCheckingEmail(false);
        }
      }
    };

    fetchEmailUsage();
  }, [status, isLoading]);

  const handleDeleteProfile = async () => {
    if (!session?.user?.id) return;
    if (!session?.user?.email) return;

    if (confirmEmail !== session.user.email) {
      setDeleteError("Email doesn&apos;t match your account email");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");

      await deleteUser(session.user.id);

      // Sign out after successful deletion
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete profile",
      );
      setIsDeleting(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;

    const link = `${window.location.origin}/ref=${referralCode}`;
    await navigator.clipboard.writeText(link);

    toast.success("Referral link copied to clipboard");
  };

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        data-oid="0aa67ve"
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
          data-oid="go7_.u1"
        ></div>
      </div>
    );
  }

  return (
    <Layout data-oid="3ydseba">
      <ToastWrapper data-oid="6lsg72w">
        <div className="max-w-4xl mx-auto py-8 px-4" data-oid="2utadl7">
          <h1 className="text-3xl font-bold mb-6" data-oid="5p1k23o">
            Dashboard
          </h1>

          {/* Referral Section */}
          <Card className="p-6 mb-6" data-oid="ezq8sy_">
            <h2 className="text-xl font-semibold mb-4" data-oid="_rri5rt">
              Refer Friends
            </h2>
            <p
              className="text-sm text-gray-600 dark:text-gray-300 mb-4"
              data-oid="wchh_k6"
            >
              Share your referral link and get +10 monthly emails for each
              friend who signs up!
            </p>

            <div className="flex items-center gap-3" data-oid="70uif_z">
              <div
                className={`flex-1 p-3 rounded-lg border ${
                  resolvedTheme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
                data-oid="6_4tfft"
              >
                {isLoadingCode ? (
                  <div
                    className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    data-oid="wzkjqod"
                  />
                ) : (
                  <code className="text-sm" data-oid="nb5hp97">
                    {referralLink}
                  </code>
                )}
              </div>

              <button
                onClick={copyReferralLink}
                disabled={isLoadingCode || !referralCode}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLoadingCode || !referralCode
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                data-oid="ibjrt1c"
              >
                Copy Link
              </button>
            </div>
          </Card>

          {/* --- Corrected Quota Display Grid --- */}
          <div className="grid gap-8 md:grid-cols-2 mb-6" data-oid="k:4qzlm">
            {/* Email Quota Card - Use EmailQuotaDisplay with props from useEmailLimits */}
            <div data-oid=".1vxouk">
              <EmailQuotaDisplay
                usage={usage}
                isLoading={isChecking}
                quotaError={quotaError}
                variant="dashboard"
                data-oid="4.55q_z"
              />
            </div>

            {/* Search Quota Card - Use QuotaDisplay (handles search internally) */}
            <div data-oid=":mqkbcn">
              <QuotaDisplay data-oid="qsf53p:" />
            </div>
          </div>
          {/* --- End Quota Display Grid --- */}

          <div
            className={`${
              resolvedTheme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900"
            } shadow rounded-lg p-6 mb-6`}
            data-oid="yhujbd7"
          >
            <h2 className="text-xl font-semibold mb-4" data-oid="7f1:a-m">
              Your Profile
            </h2>
            <div className="space-y-2" data-oid="00uc_cb">
              <p data-oid="hiaapfs">
                <strong data-oid="ir4g_0h">Name:</strong>{" "}
                {session?.user?.name || "Not available"}
              </p>
              <p data-oid="w1vk:t4">
                <strong data-oid="m0q66lo">Email:</strong>{" "}
                {session?.user?.email || "Not available"}
              </p>
              <p data-oid="4xywf1l">
                <strong data-oid="qbg2osn">Profile Status:</strong>{" "}
                {session?.exists ? "Complete" : "Incomplete"}
              </p>
            </div>
          </div>

          <div
            className={`${
              resolvedTheme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900"
            } shadow rounded-lg p-6 mb-6`}
            data-oid="xgauef3"
          >
            <h2 className="text-xl font-semibold mb-4" data-oid="0:76u7_">
              Recent Searches
            </h2>
            <p
              className={`${
                resolvedTheme === "dark" ? "text-gray-300" : "text-gray-500"
              }`}
              data-oid="iw6cobr"
            >
              You haven&apos;t performed any searches yet.
            </p>
          </div>

          <div
            className={`${
              resolvedTheme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900"
            } shadow rounded-lg p-6 mb-6`}
            data-oid="x1tf3tm"
          >
            <h2 className="text-xl font-semibold mb-4" data-oid="azxthjf">
              Email History
            </h2>
            <EmailHistory data-oid="cwula78" />
          </div>

          <div
            className={`${
              resolvedTheme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900"
            } shadow rounded-lg p-6`}
            data-oid="gcn4kyk"
          >
            <h2 className="text-xl font-semibold mb-4" data-oid="4qjmunh">
              Account Management
            </h2>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              data-oid="dum.43z"
            >
              Delete Profile
            </button>
            <p className="mt-2 text-sm text-gray-500" data-oid="re27-.1">
              This will permanently delete your profile and all associated data.
            </p>
          </div>
        </div>

        {/* Delete Profile Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            data-oid="a2ug:f4"
          >
            <div
              className={`${
                resolvedTheme === "dark"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-900"
              } rounded-lg p-6 max-w-md w-full`}
              data-oid="2:x4.m_"
            >
              <h2 className="text-xl font-bold mb-4" data-oid="ppux85a">
                Delete Profile
              </h2>
              <p className="mb-4" data-oid="gb5-h4t">
                This action cannot be undone. All your profile data will be
                permanently deleted.
              </p>
              <p className="mb-4" data-oid="3g23:sq">
                To confirm, please type your email address:{" "}
                <strong data-oid="frc.8.e">{session?.user?.email}</strong>
              </p>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full p-2 mb-4 border rounded ${
                  resolvedTheme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
                disabled={isDeleting}
                data-oid="usiorvx"
              />

              {deleteError && (
                <p className="text-red-500 mb-4" data-oid="brfk2wg">
                  {deleteError}
                </p>
              )}
              <div className="flex justify-end space-x-3" data-oid="p5ukr.7">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-4 py-2 rounded ${
                    resolvedTheme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  } transition-colors`}
                  disabled={isDeleting}
                  data-oid="129f2kl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isDeleting || confirmEmail !== session?.user?.email}
                  data-oid="xv7y.f2"
                >
                  {isDeleting ? "Deleting..." : "Delete Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ToastWrapper>
    </Layout>
  );
}
