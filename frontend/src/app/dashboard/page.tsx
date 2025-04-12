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

  useEffect(() => {
    console.log("DashboardPage - Session status:", status);
    console.log("DashboardPage - Session data:", session);

    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      console.log(
        "DashboardPage - User is not authenticated, redirecting to home"
      );
      router.push("/");
    } else if (status === "authenticated") {
      console.log("DashboardPage - User is authenticated");
      // If user doesn't exist in the database, redirect to complete-profile
      if (session?.exists === false) {
        console.log(
          "DashboardPage - User does not exist, redirecting to complete-profile"
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
        error instanceof Error ? error.message : "Failed to delete profile"
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <ToastWrapper>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

          {/* Referral Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Refer Friends</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Share your referral link and get +10 monthly emails for each
              friend who signs up!
            </p>

            <div className="flex items-center gap-3">
              <div
                className={`flex-1 p-3 rounded-lg border ${
                  resolvedTheme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                {isLoadingCode ? (
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  <code className="text-sm">{referralLink}</code>
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
              >
                Copy Link
              </button>
            </div>
          </Card>

          {/* Email Generation Quota Card */}
          <EmailQuotaDisplay
            usage={usage}
            isLoading={isChecking}
            quotaError={quotaError}
            variant="dashboard"
          />

          <div
            className={`${
              resolvedTheme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900"
            } shadow rounded-lg p-6 mb-6`}
          >
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {session?.user?.name || "Not available"}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {session?.user?.email || "Not available"}
              </p>
              <p>
                <strong>Profile Status:</strong>{" "}
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
          >
            <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
            <p
              className={`${
                resolvedTheme === "dark" ? "text-gray-300" : "text-gray-500"
              }`}
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
          >
            <h2 className="text-xl font-semibold mb-4">Email History</h2>
            <EmailHistory />
          </div>

          <div
            className={`${
              resolvedTheme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900"
            } shadow rounded-lg p-6`}
          >
            <h2 className="text-xl font-semibold mb-4">Account Management</h2>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete Profile
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete your profile and all associated data.
            </p>
          </div>
        </div>

        {/* Delete Profile Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`${
                resolvedTheme === "dark"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-900"
              } rounded-lg p-6 max-w-md w-full`}
            >
              <h2 className="text-xl font-bold mb-4">Delete Profile</h2>
              <p className="mb-4">
                This action cannot be undone. All your profile data will be
                permanently deleted.
              </p>
              <p className="mb-4">
                To confirm, please type your email address:{" "}
                <strong>{session?.user?.email}</strong>
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
              />
              {deleteError && (
                <p className="text-red-500 mb-4">{deleteError}</p>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-4 py-2 rounded ${
                    resolvedTheme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  } transition-colors`}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isDeleting || confirmEmail !== session?.user?.email}
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
