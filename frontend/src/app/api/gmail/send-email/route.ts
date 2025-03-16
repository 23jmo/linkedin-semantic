import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/server/gmail-service";
import { storeEmailHistory } from "@/lib/server/email-credentials";
import { auth } from "@/auth";

export async function POST(request: Request) {
  console.log("[API] POST /api/gmail/send-email - Request received");

  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log(
        "[API] POST /api/gmail/send-email - Unauthorized: No session or user ID"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { to, subject, body, recipientProfileId, recipientName } =
      await request.json();
    console.log(`[API] POST /api/gmail/send-email - Sending email to: ${to}`);

    if (!to || !subject || !body) {
      console.log("[API] POST /api/gmail/send-email - Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send the email
    console.log(
      `[API] POST /api/gmail/send-email - Sending email for user: ${session.user.id}`
    );
    await sendEmail(session.user.id, to, subject, body);

    // Store in email history
    if (recipientProfileId && recipientName) {
      console.log(
        `[API] POST /api/gmail/send-email - Storing email history for recipient: ${recipientName}`
      );
      await storeEmailHistory(
        session.user.id,
        recipientProfileId,
        recipientName,
        to,
        subject,
        body
      );
    }

    console.log("[API] POST /api/gmail/send-email - Email sent successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/gmail/send-email - Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}
