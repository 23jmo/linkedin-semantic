import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getEmailCredentials,
  storeEmailHistory,
} from "@/lib/server/email-credentials";
import { google } from "googleapis";
import { getUserEmail } from "@/lib/api";
import { ProfileFrontend } from "@/types/types";

const logPrefix = "[API:/api/send-email]";

// Custom error class to signal re-authentication needed
class ReAuthenticationRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReAuthenticationRequiredError";
  }
}

// Custom error class to signal re-authentication needed
class NestedError extends Error {
  response?: { data?: { error?: string } };
  constructor(message: string, response?: { data?: { error?: string } }) {
    super(message);
    this.name = "NestedError";
    this.response = response;
  }
}

/**
 * Helper function to find the best available email address for a profile.
 * @param profile The profile data.
 * @returns The email address string or null if not found.
 */
async function findRecipientEmail(
  profile: ProfileFrontend
): Promise<string | null> {
  // 1. Try fetching from database via user_id
  if (profile.user_id) {
    try {
      const email = await getUserEmail(profile.user_id);
      if (email) {
        console.log(
          `${logPrefix} Found email for ${profile.firstName} ${profile.lastName} from DB: Yes`
        );
        return email;
      } else {
        console.log(
          `${logPrefix} No email found for ${profile.firstName} ${profile.lastName} in DB`
        );
      }
    } catch (error) {
      console.error(
        `${logPrefix} Error fetching email from DB for profile ${profile.id}:`,
        error
      );
    }
  }

  // 2. Fallback to raw profile data
  // if (profile.raw_profile_data) {
  //   // Use `any` assertion or check property existence for flexibility
  //   const rawData: RawProfile = profile.raw_profile_data;
  //   if (typeof rawData === "object" && rawData !== null) {
  //     // Check for property existence before accessing
  //     if (typeof rawData.email === "string" && rawData.email) {
  //       console.log(`${logPrefix} Found email in rawData.email`);
  //       return rawData.email;
  //     }
  //     if (typeof rawData.emailAddress === "string" && rawData.emailAddress) {
  //       console.log(`${logPrefix} Found email in rawData.emailAddress`);
  //       return rawData.emailAddress;
  //     }
  //     // Check nested property existence
  //     if (
  //       typeof rawData.contact_info === "object" &&
  //       rawData.contact_info !== null &&
  //       typeof rawData.contact_info.email === "string" &&
  //       rawData.contact_info.email
  //     ) {
  //       console.log(`${logPrefix} Found email in rawData.contact_info.email`);
  //       return rawData.contact_info.email;
  //     }
  //   }
  // }

  // console.log(
  //   `${logPrefix} No suitable email found for ${profile.firstName} ${profile.lastName}.`
  // );
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // --- Authenticatioxn & Initial Setup ---
    const session = await auth();
    if (!session?.user?.id) {
      console.error(`${logPrefix} Authentication required.`);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    console.log(`${logPrefix} Request initiated by user: ${userId}`);

    const { profiles, purpose, emailContents } = await request.json();

    console.log(`${logPrefix} Email Send Request Details:`, {
      userId,
      recipientCount: profiles?.length ?? 0,
      purpose:
        purpose?.substring(0, 100) + (purpose?.length > 100 ? "..." : ""),
    });

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      console.error(`${logPrefix} Validation Error: No recipients provided.`);
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    // --- Gmail Client Setup ---
    const credentials = await getEmailCredentials(userId, "gmail");
    if (!credentials?.access_token || !credentials?.refresh_token) {
      console.error(
        `${logPrefix} Gmail credentials not found for user ${userId}.`
      );
      // If credentials aren't found AT ALL, this might also imply re-auth is needed, or initial setup.
      // Consider returning the specific 401 code here too if appropriate.
      return NextResponse.json(
        { error: "Gmail credentials not found or incomplete" },
        { status: 400 } // Or potentially 401 if it means re-auth
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      `${process.env.NEXTAUTH_URL}/api/auth/gmail-auth/callback`
    );
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // --- Process Emails Concurrently ---
    // Create promises for each email sending operation
    const sendPromises = profiles.map(async (profile: ProfileFrontend) => {
      // Find recipient email
      let recipientEmail: string;
      const foundEmail = await findRecipientEmail(profile);

      if (foundEmail) {
        recipientEmail = foundEmail;
      } else {
        // Use fallback if no email found
        recipientEmail = `${profile.firstName?.toLowerCase() || "user"}.${
          profile.lastName?.toLowerCase() || Date.now()
        }@example.com`; // Added null checks for names
        console.log(
          `${logPrefix} Using fallback email for ${profile.id}: ${recipientEmail}`
        );
      }

      // Get email content for this profile
      const emailContent = emailContents[profile.id];
      if (!emailContent?.subject || !emailContent?.body) {
        console.error(
          `${logPrefix} Email content missing for profile ${profile.id}`
        );
        // Throw an error for this specific profile if content is missing
        throw new Error(
          `Email content missing for ${profile.firstName} ${profile.lastName}`
        );
      }

      // Convert newlines to <br> tags for HTML email
      const htmlBody = emailContent.body.replace(/\n/g, "<br>");

      // Log the email being sent
      console.log(
        `${logPrefix} Preparing to send email to ${recipientEmail} for profile ${profile.id}`
      );

      // Create the message

      const rawMessage = [
        `To: ${recipientEmail}`,
        `Subject: ${emailContent.subject}`,
        `Content-Type: text/html; charset=utf-8`,
        "", // Add empty string for the blank line separator
        htmlBody, // Use the htmlBody directly
      ].join("\r\n");

      const message = {
        raw: Buffer.from(rawMessage).toString("base64url"),
      };

      // Send the email via Gmail API
      try {
        await gmail.users.messages.send({
          userId: "me",
          requestBody: message,
        });
        console.log(
          `${logPrefix} Email successfully sent for profile ${profile.id}`
        );

        // Store email history on success
        await storeEmailHistory(
          userId,
          profile.id,
          `${profile.firstName || ""} ${profile.lastName || ""}`.trim(), // Handle potential null names
          recipientEmail,
          emailContent.subject,
          emailContent.body
        );
        console.log(
          `${logPrefix} Email history stored for profile ${profile.id}`
        );

        return { profileId: profile.id, success: true };
      } catch (error) {
        console.error(
          `${logPrefix} Error sending email via Gmail for profile ${profile.id}:`,
          error
        );
        // Check if the error is an invalid grant
        if (
          error instanceof Error &&
          (error.message.includes("invalid_grant") || // Standard invalid grant
            (error as NestedError).response?.data?.error === "invalid_grant") // Check nested error obj
        ) {
          console.warn(
            `${logPrefix} Invalid grant detected for profile ${profile.id}. Throwing ReAuthenticationRequiredError.`
          );
          // Throw specific error to be caught by the outer handler
          throw new ReAuthenticationRequiredError("Gmail token invalid");
        }
        // For other Gmail API errors, throw a new error or re-throw
        // Wrapping it provides context about which profile failed
        throw new Error(
          `Failed to send email for profile ${profile.id}: ${
            error instanceof Error ? error.message : "Unknown Gmail API error"
          }`
        );
      }
    }); // End of profiles.map

    // --- Wait for all send operations and handle results ---
    let results;
    try {
      results = await Promise.all(sendPromises);
      // If Promise.all resolves, all individual promises either succeeded
      // or caught their specific errors and threw the ReAuthenticationRequiredError or another error.
      // If ReAuthenticationRequiredError was thrown, it would be caught below.
      // If other errors were thrown, they'd also be caught below.
      console.log(
        `${logPrefix} All email promises settled. Result count: ${results.length}`
      );
    } catch (error) {
      // Catch errors propagated from the map promises
      console.error(`${logPrefix} Error during Promise.all execution:`, error);

      // Check if it's the specific re-authentication error
      if (error instanceof ReAuthenticationRequiredError) {
        console.warn(
          `${logPrefix} ReAuthenticationRequiredError caught. Returning 401.`
        );
        return NextResponse.json(
          {
            error: "Gmail re-authentication required",
            code: "GMAIL_REAUTH_REQUIRED",
          },
          { status: 401 }
        );
      }

      // For any other error caught from Promise.all (like content missing error, or other Gmail errors)
      // Re-throw it to be caught by the final generic error handler
      throw error;
    }

    // If we reach here, all sends were successful (or handled individually if needed)
    console.log(
      `${logPrefix} All emails processed successfully. Final results:`,
      results
    );
    return NextResponse.json({ success: true, results });
  } catch (error) {
    // Final catch-all for any errors not handled above (including re-thrown ones)
    console.error(`${logPrefix} Unhandled error in POST handler:`, error);
    return NextResponse.json(
      {
        error: "Failed to process email request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
