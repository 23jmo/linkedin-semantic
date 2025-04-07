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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

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
              <strong>Email:</strong> {session?.user?.email || "Not available"}
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
            {deleteError && <p className="text-red-500 mb-4">{deleteError}</p>}
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
    </Layout>
  );
}
