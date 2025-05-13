"use client";

import { useState, useEffect } from "react";
import ProfileImage from "./ProfileImage";
import { FaTimes } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import GmailConnector from "./GmailConnector";
import { useSession } from "next-auth/react";
import { checkUserExists, getLinkedInProfile } from "@/lib/api";
import { ProfileFrontend, RawProfile } from "../types/types";
import { useEmailLimits } from "@/hooks/useEmailLimits";
import EmailQuotaDisplay from "./EmailQuotaDisplay";
import { sendEmailBatch } from "@/lib/gmail-service";
import { ensureValidProfile } from "@/lib/utils/profile-transformers";

interface EmailComposerProps {
  selectedProfiles: ProfileFrontend[];
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
    null,
  );
  const { resolvedTheme } = useTheme();
  const { data: session } = useSession();

  // New state for email generation
  const [generatedEmails, setGeneratedEmails] = useState<
    Record<string, { subject: string; body: string }>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showGeneratedEmails, setShowGeneratedEmails] = useState(false);

  const { checkCanGenerateEmail, isChecking, usage, quotaError } =
    useEmailLimits();

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
    // Don't reset generated emails when purpose changes
  };

  const handleNoteChange = (profileId: string, note: string) => {
    setNotes((prev) => ({
      ...prev,
      [profileId]: note,
    }));
    // Don't reset generated emails when notes change
  };

  const handleEmailSubjectChange = (profileId: string, subject: string) => {
    setGeneratedEmails((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        subject,
      },
    }));
  };

  const handleEmailBodyChange = (profileId: string, body: string) => {
    setGeneratedEmails((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        body,
      },
    }));
  };

  const handleGenerateEmails = async () => {
    const canGenerate = await checkCanGenerateEmail();

    if (!canGenerate) {
      setGenerationError("You have reached your email generation limit");
      return;
    }

    if (!purpose) {
      setGenerationError("Please specify the purpose of your email");
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);

    try {
      let senderProfile: RawProfile;

      if (session?.user?.id) {
        try {
          // Pass the user object correctly to checkUserExists
          const userProfile = await checkUserExists(session.user, {});
          console.log(
            "[EmailComposer] Raw userProfile from checkUserExists:",
            userProfile,
          );

          // get the linkedin profile from the userProfile

          const linkedinProfile = await getLinkedInProfile(session.user.id);

          senderProfile = linkedinProfile.linkedin_profile.raw_profile_data;

          // we need to structure senderProfile to match the ProfileFrontend type

          console.log("[EmailComposer] Sender profile:", senderProfile);
        } catch (error) {
          console.error("Error fetching sender profile:", error);
          // Keep using the default senderProfile from session
        }
      } else {
        console.warn("[EmailComposer] No user ID available in session");
      }

      //structure sender profile to match the ProfileFrontend type

      const frontendSenderProfile = ensureValidProfile(senderProfile);

      const emailPromises = selectedProfiles.map(
        async (profile: ProfileFrontend) => {
          const response = await fetch("/api/generate-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipientProfile: profile,
              senderProfile: frontendSenderProfile,
              purpose:
                purpose +
                (notes[profile.id]
                  ? `\n Additional User Notes: ${notes[profile.id]}`
                  : ""),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error ||
                `Failed to generate email for ${profile.firstName}`,
            );
          }

          const data = await response.json();
          return {
            profileId: profile.id,
            subject: data.subject,
            body: data.body,
          };
        },
      );

      const results = await Promise.all(emailPromises);

      const newGeneratedEmails: Record<
        string,
        { subject: string; body: string }
      > = {};
      results.forEach((result) => {
        newGeneratedEmails[result.profileId] = {
          subject: result.subject,
          body: result.body,
        };
      });

      setGeneratedEmails(newGeneratedEmails);
      setShowGeneratedEmails(true);

      // Refresh the quota after successful generation
      await checkCanGenerateEmail();
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : "Failed to generate emails",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchQuota = async () => {
      if (session?.user?.id) {
        await checkCanGenerateEmail();
      }
    };

    fetchQuota();
  }, [session?.user?.id, checkCanGenerateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log("[EmailComposer] handleSubmit initiated");

    try {
      // Prepare the payload for the sendEmailBatch function
      const emailContents = selectedProfiles.reduce(
        (acc, profile) => {
          acc[profile.id] = generatedEmails[profile.id] || {
            subject: "",
            body: "",
          };
          return acc;
        },
        {} as Record<string, { subject: string; body: string }>,
      );

      const payload = {
        profiles: selectedProfiles,
        purpose,
        emailContents,
      };
      console.log("[EmailComposer] Calling sendEmailBatch with payload:", {
        purpose: payload.purpose,
        profileCount: payload.profiles.length,
      });

      // Call the imported function from gmail-service
      const result = await sendEmailBatch(payload);

      // sendEmailBatch returns null if redirection for re-auth occurred.
      // If it returns successfully, we proceed.
      if (result !== null) {
        console.log("[EmailComposer] sendEmailBatch successful:", result);
        setSuccess(true);
        // Reset form after success
        setPurpose("");
        setNotes({});
        setGeneratedEmails({});
        setShowGeneratedEmails(false);
      } else {
        // If result is null, re-auth redirect was initiated by sendEmailBatch.
        // The page will reload after re-auth, so no specific UI update is needed here,
        // but we log it for clarity.
        console.log(
          "[EmailComposer] sendEmailBatch initiated re-auth. No further action in handleSubmit.",
        );
        // Keep isLoading true because the page will likely redirect/reload
        // setIsLoading(false); // Don't set loading to false here
      }
    } catch (err) {
      // This catch block now only handles errors *not* caught by sendEmailBatch
      // (e.g., network errors, or errors thrown by sendEmailBatch other than re-auth)
      console.error("[EmailComposer] Error in handleSubmit:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false); // Set loading false on error
    }
    // Removed finally block that set isLoading false, as it interferes with re-auth redirect
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      data-oid="4o_zzc0"
    >
      <div
        className={`${
          resolvedTheme === "light" ? "bg-white" : "bg-gray-800"
        } rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
        data-oid="te.r9u3"
      >
        <div className="p-6" data-oid="x0lul2k">
          <div
            className="flex justify-between items-center mb-6"
            data-oid="f4v2593"
          >
            <h2
              className={`text-xl font-bold ${
                resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
              data-oid=":sxrbfd"
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
              data-oid="y8j_be3"
            >
              <FaTimes data-oid="avu664v" />
            </button>
          </div>

          {success ? (
            <div
              className={`${
                resolvedTheme === "light"
                  ? "bg-green-50 text-green-800"
                  : "bg-green-900 text-green-100"
              } p-4 rounded-md mb-6`}
              data-oid="ewqyif0"
            >
              <p data-oid="_d:.o7c">Emails sent successfully!</p>
              <button
                onClick={onClose}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                data-oid="h25qjst"
              >
                Done
              </button>
            </div>
          ) : isGmailConnected === false ? (
            <div data-oid="4a1o8l-">
              <p
                className={`mb-4 ${
                  resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
                data-oid="jjbzcdq"
              >
                To send cold emails, you need to connect your Gmail account
                first.
              </p>
              <GmailConnector data-oid="16oukwi" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} data-oid="ofdee5w">
              <div className="mb-6" data-oid="wlcgp3_">
                <label
                  className={`block text-sm font-medium ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-2`}
                  data-oid="fknv7ba"
                >
                  Selected Recipients ({selectedProfiles.length}/3)
                </label>
                <div className="space-y-3" data-oid="sn6ehtp">
                  {selectedProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`flex items-start p-3 border rounded-md ${
                        resolvedTheme === "light"
                          ? "border-gray-200"
                          : "border-gray-700"
                      }`}
                      data-oid="o7w94hj"
                    >
                      <div className="flex-shrink-0 mr-3" data-oid="v.izr2h">
                        <ProfileImage
                          imageUrl={profile.profilePicture}
                          firstName={profile.firstName}
                          lastName={profile.lastName}
                          size="sm"
                          data-oid="8ies2n2"
                        />
                      </div>
                      <div className="flex-grow" data-oid="cdptg4m">
                        <div
                          className="flex justify-between items-start"
                          data-oid="zs4o4fg"
                        >
                          <div data-oid="cyihq.l">
                            <h3
                              className={`font-medium ${
                                resolvedTheme === "light"
                                  ? "text-gray-800"
                                  : "text-gray-200"
                              }`}
                              data-oid="0xynfgk"
                            >
                              {profile.firstName} {profile.lastName}
                            </h3>
                            <p
                              className={`text-sm ${
                                resolvedTheme === "light"
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                              data-oid="z6.:leo"
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
                            data-oid="nun6:uz"
                          >
                            <FaTimes size={16} data-oid="uyctk_j" />
                          </button>
                        </div>
                        <div className="mt-2" data-oid="u38.vls">
                          <label
                            className={`block text-xs font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-500"
                                : "text-gray-400"
                            } mb-1`}
                            data-oid="rp4j3tg"
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
                            data-oid="wdrndb1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6" data-oid="isg7vot">
                <label
                  htmlFor="purpose"
                  className={`block text-sm font-medium ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-2`}
                  data-oid="c33m9ew"
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
                  data-oid="4m-jam3"
                />
              </div>

              {/* Email Quota Display */}
              <EmailQuotaDisplay
                usage={usage}
                isLoading={isChecking}
                quotaError={quotaError}
                variant="compact"
                data-oid="2pjfbsf"
              />

              {(generationError || quotaError) && (
                <div
                  className={`${
                    resolvedTheme === "light"
                      ? "bg-red-50 text-red-800"
                      : "bg-red-900 text-red-100"
                  } p-4 rounded-md mb-6`}
                  data-oid="l_vy:.6"
                >
                  <p data-oid="ood8y0:">{generationError || quotaError}</p>
                </div>
              )}

              <div className="flex justify-end mb-6" data-oid="t25fjg1">
                <button
                  type="button"
                  onClick={handleGenerateEmails}
                  disabled={isGenerating || !purpose}
                  className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center ${
                    isGenerating || !purpose
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                  data-oid="yhgn2.9"
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        data-oid="wxr3.m2"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          data-oid="1kh5:99"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          data-oid="j14x8xr"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : showGeneratedEmails ? (
                    "Regenerate Emails"
                  ) : (
                    "Generate Emails"
                  )}
                </button>
              </div>

              {showGeneratedEmails && (
                <div className="mb-6" data-oid="qblfoba">
                  <h3
                    className={`text-lg font-medium mb-4 ${
                      resolvedTheme === "light"
                        ? "text-gray-800"
                        : "text-gray-200"
                    }`}
                    data-oid="ktaqmay"
                  >
                    Generated Emails
                  </h3>
                  <div className="space-y-6" data-oid="m17v2bj">
                    {selectedProfiles.map((profile) => (
                      <div
                        key={`email-${profile.id}`}
                        className={`p-4 border rounded-md ${
                          resolvedTheme === "light"
                            ? "border-gray-200 bg-gray-50"
                            : "border-gray-700 bg-gray-900"
                        }`}
                        data-oid="9__vx3i"
                      >
                        <div
                          className="flex items-center mb-3"
                          data-oid="eo_-2ek"
                        >
                          <ProfileImage
                            imageUrl={profile.profilePicture}
                            firstName={profile.firstName}
                            lastName={profile.lastName}
                            size="sm"
                            data-oid="vvjp69i"
                          />

                          <div className="ml-3" data-oid="ux5igx6">
                            <h4
                              className={`font-medium ${
                                resolvedTheme === "light"
                                  ? "text-gray-800"
                                  : "text-gray-200"
                              }`}
                              data-oid="re7r1.:"
                            >
                              {profile.firstName} {profile.lastName}
                            </h4>
                            <p
                              className={`text-sm ${
                                resolvedTheme === "light"
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                              data-oid="56tu5f1"
                            >
                              {profile.profileUrl || "No profile URL available"}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3" data-oid="vwxbbep">
                          <label
                            className={`block text-sm font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            } mb-1`}
                            data-oid="fis3nih"
                          >
                            Subject
                          </label>
                          <input
                            type="text"
                            value={generatedEmails[profile.id]?.subject || ""}
                            onChange={(e) =>
                              handleEmailSubjectChange(
                                profile.id,
                                e.target.value,
                              )
                            }
                            className={`w-full border rounded-md p-2 ${
                              resolvedTheme === "light"
                                ? "border-gray-300"
                                : "border-gray-600 bg-gray-700"
                            }`}
                            placeholder="Email subject"
                            data-oid="adfl3d3"
                          />
                        </div>

                        <div data-oid="9tohfzh">
                          <label
                            className={`block text-sm font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            } mb-1`}
                            data-oid="2wsn1ue"
                          >
                            Message
                          </label>
                          <textarea
                            value={generatedEmails[profile.id]?.body || ""}
                            onChange={(e) =>
                              handleEmailBodyChange(profile.id, e.target.value)
                            }
                            className={`w-full border rounded-md p-3 ${
                              resolvedTheme === "light"
                                ? "border-gray-300"
                                : "border-gray-600 bg-gray-700"
                            }`}
                            rows={8}
                            placeholder="Email body"
                            data-oid="x8oowe3"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div
                  className={`${
                    resolvedTheme === "light"
                      ? "bg-red-50 text-red-800"
                      : "bg-red-900 text-red-100"
                  } p-4 rounded-md mb-6`}
                  data-oid="u_19x1j"
                >
                  <p data-oid="exae6du">{error}</p>
                </div>
              )}

              <div className="flex justify-end" data-oid="r7.2qmp">
                <button
                  type="button"
                  onClick={onClose}
                  className={`mr-3 py-2 px-4 rounded ${
                    resolvedTheme === "light"
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  }`}
                  disabled={isLoading}
                  data-oid="x66j5s5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center ${
                    isLoading ||
                    selectedProfiles.length === 0 ||
                    !showGeneratedEmails ||
                    !Object.values(generatedEmails).every(
                      (email) => email?.subject?.trim() && email?.body?.trim(),
                    )
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    isLoading ||
                    selectedProfiles.length === 0 ||
                    !showGeneratedEmails ||
                    !Object.values(generatedEmails).every(
                      (email) => email?.subject?.trim() && email?.body?.trim(),
                    )
                  }
                  data-oid="nujpg32"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        data-oid="ks:f6k6"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          data-oid="qtc-x4s"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          data-oid="et0fppp"
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
