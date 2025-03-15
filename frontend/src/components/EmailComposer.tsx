"use client";

import { useState, useEffect } from "react";
import { Profile } from "@/types/profile";
import ProfileImage from "./ProfileImage";
import { FaTimes } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import { hasGmailConnected } from "@/lib/gmail-service";
import GmailConnector from "./GmailConnector";
import { useSession } from "next-auth/react";

interface EmailComposerProps {
  selectedProfiles: Profile[];
  onClose: () => void;
  onRemoveProfile: (profileId: string) => void;
}

export default function EmailComposer({
  selectedProfiles,
  onClose,
  onRemoveProfile,
}: EmailComposerProps) {
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState<boolean | null>(
    null
  );
  const { resolvedTheme } = useTheme();
  const { data: session } = useSession();

  // Close the composer when there are no profiles selected
  useEffect(() => {
    if (selectedProfiles.length === 0) {
      onClose();
    }
  }, [selectedProfiles, onClose]);

  // Check if Gmail is connected
  useEffect(() => {
    async function checkGmailConnection() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/gmail/check-connection");
          if (response.ok) {
            const data = await response.json();
            setIsGmailConnected(data.isConnected);
          } else {
            setIsGmailConnected(false);
          }
        } catch (error) {
          console.error("Error checking Gmail connection:", error);
          setIsGmailConnected(false);
        }
      }
    }

    checkGmailConnection();
  }, [session]);

  const handlePurposeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPurpose(e.target.value);
  };

  const handleNoteChange = (profileId: string, note: string) => {
    setNotes((prev) => ({
      ...prev,
      [profileId]: note,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profiles: selectedProfiles,
          purpose,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send email");
      }

      setSuccess(true);
      // Reset form after success
      setPurpose("");
      setNotes({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${
          resolvedTheme === "light" ? "bg-white" : "bg-gray-800"
        } rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2
              className={`text-xl font-bold ${
                resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
            >
              Compose Cold Email
            </h2>
            <button
              onClick={onClose}
              className={`${
                resolvedTheme === "light"
                  ? "text-gray-500 hover:text-gray-700"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          {success ? (
            <div
              className={`${
                resolvedTheme === "light"
                  ? "bg-green-50 text-green-800"
                  : "bg-green-900 text-green-100"
              } p-4 rounded-md mb-6`}
            >
              <p>Emails sent successfully!</p>
              <button
                onClick={onClose}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Done
              </button>
            </div>
          ) : isGmailConnected === false ? (
            <div>
              <p
                className={`mb-4 ${
                  resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                To send cold emails, you need to connect your Gmail account
                first.
              </p>
              <GmailConnector />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  className={`block text-sm font-medium ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-2`}
                >
                  Selected Recipients ({selectedProfiles.length}/3)
                </label>
                <div className="space-y-3">
                  {selectedProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`flex items-start p-3 border rounded-md ${
                        resolvedTheme === "light"
                          ? "border-gray-200"
                          : "border-gray-700"
                      }`}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <ProfileImage
                          imageUrl={profile.profilePicture}
                          firstName={profile.firstName}
                          lastName={profile.lastName}
                          size="sm"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3
                              className={`font-medium ${
                                resolvedTheme === "light"
                                  ? "text-gray-800"
                                  : "text-gray-200"
                              }`}
                            >
                              {profile.firstName} {profile.lastName}
                            </h3>
                            <p
                              className={`text-sm ${
                                resolvedTheme === "light"
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              {profile.headline || ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveProfile(profile.id)}
                            className={`${
                              resolvedTheme === "light"
                                ? "text-gray-400 hover:text-gray-600"
                                : "text-gray-400 hover:text-gray-200"
                            }`}
                            aria-label={`Remove ${profile.firstName} ${profile.lastName}`}
                          >
                            <FaTimes size={16} />
                          </button>
                        </div>
                        <div className="mt-2">
                          <label
                            className={`block text-xs font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-500"
                                : "text-gray-400"
                            } mb-1`}
                          >
                            Additional notes for {profile.firstName}
                          </label>
                          <textarea
                            value={notes[profile.id] || ""}
                            onChange={(e) =>
                              handleNoteChange(profile.id, e.target.value)
                            }
                            className={`w-full text-sm border rounded-md p-2 ${
                              resolvedTheme === "light"
                                ? "border-gray-300"
                                : "border-gray-600 bg-gray-700"
                            }`}
                            rows={2}
                            placeholder={`Specific points for ${profile.firstName}...`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="purpose"
                  className={`block text-sm font-medium ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-2`}
                >
                  What do you want to accomplish with this email?
                </label>
                <textarea
                  id="purpose"
                  value={purpose}
                  onChange={handlePurposeChange}
                  className={`w-full border rounded-md p-3 ${
                    resolvedTheme === "light"
                      ? "border-gray-300"
                      : "border-gray-600 bg-gray-700"
                  }`}
                  rows={4}
                  placeholder="E.g., Set up a coffee chat, ask about job opportunities, request advice..."
                  required
                />
              </div>

              {error && (
                <div
                  className={`${
                    resolvedTheme === "light"
                      ? "bg-red-50 text-red-800"
                      : "bg-red-900 text-red-100"
                  } p-4 rounded-md mb-6`}
                >
                  <p>{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className={`mr-3 py-2 px-4 rounded ${
                    resolvedTheme === "light"
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  }`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
                  disabled={isLoading || selectedProfiles.length === 0}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
