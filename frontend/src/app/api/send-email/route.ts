import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getEmailCredentials,
  storeEmailHistory,
} from "@/lib/server/email-credentials";
import { google } from "googleapis";
import { getUserEmail } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const { profiles, purpose, notes, emailContents } = await request.json();

    // Log the email request
    console.log("Email Send Request:", {
      userId: session.user.id,
      recipientCount: profiles.length,
      recipients: profiles.map((p: any) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
      })),
      purpose: purpose.substring(0, 100) + (purpose.length > 100 ? "..." : ""),
    });

    // Validate required fields
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    // Get Gmail credentials
    const credentials = await getEmailCredentials(session.user.id, "gmail");
    if (!credentials) {
      return NextResponse.json(
        { error: "Gmail credentials not found" },
        { status: 400 }
      );
    }

    // Set up Gmail API client
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

    // Send emails to each recipient
    const results = await Promise.all(
      profiles.map(async (profile) => {
        // Get recipient email from database
        let recipientEmail = "";

        try {
          // Use the getUserEmail function from api.ts
          console.log("Fucking Profile", profile);
          const email = await getUserEmail(profile.user_id);
          if (email) {
            recipientEmail = email;
            console.log(
              `Found email for ${profile.firstName} ${profile.lastName} from database: Yes`
            );
          } else {
            console.log(
              `No email found for ${profile.firstName} ${profile.lastName} in database`
            );
          }
        } catch (error) {
          console.error("Error fetching target profile email:", error);
        }

        // Fallback to profile data if database lookup failed
        if (!recipientEmail && profile.raw_profile_data) {
          const rawData = profile.raw_profile_data;
          if (typeof rawData === "object" && rawData !== null) {
            if (typeof rawData.email === "string" && rawData.email) {
              recipientEmail = rawData.email;
            } else if (
              typeof rawData.emailAddress === "string" &&
              rawData.emailAddress
            ) {
              recipientEmail = rawData.emailAddress;
            } else if (
              rawData.contact_info &&
              typeof rawData.contact_info.email === "string"
            ) {
              recipientEmail = rawData.contact_info.email;
            }
          }
        }

        // Final fallback
        if (!recipientEmail) {
          recipientEmail = `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}@example.com`;
        }

        // Get the email content for this profile
        const emailContent = emailContents[profile.id] || {
          subject: "",
          body: "",
        };
        if (!emailContent.subject || !emailContent.body) {
          throw new Error(
            `Email content missing for ${profile.firstName} ${profile.lastName}`
          );
        }

        // Log the email being sent
        console.log(
          `Sending email to ${recipientEmail} with subject ${emailContent.subject}`
        );

        // Create and send the email
        const utf8Subject = `=?utf-8?B?${Buffer.from(
          emailContent.subject
        ).toString("base64")}?=`;
        const messageParts = [
          `From: ${session.user.email!}`,
          `To: ${recipientEmail}`,
          "Content-Type: text/html; charset=utf-8",
          "MIME-Version: 1.0",
          `Subject: ${utf8Subject}`,
          "",
          emailContent.body,
        ];

        const message = messageParts.join("\n");
        const encodedMessage = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        // Send the email
        const res = await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encodedMessage },
        });

        // Store email history
        await storeEmailHistory(
          session.user.id as string,
          profile.id,
          `${profile.firstName} ${profile.lastName}`,
          recipientEmail,
          emailContent.subject,
          emailContent.body
        );

        // Log successful send
        console.log(
          `Email sent successfully to ${profile.firstName} ${profile.lastName}, message ID: ${res.data.id}`
        );

        return {
          profileId: profile.id,
          success: true,
          messageId: res.data.id,
        };
      })
    );

    console.log(`All emails sent successfully: ${results.length} emails`);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
