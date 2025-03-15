import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/server/gmail-service";
import { storeEmailHistory } from "@/lib/server/email-credentials";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { to, subject, body, recipientProfileId, recipientName } =
      await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send the email
    await sendEmail(session.user.id, to, subject, body);

    // Store in email history
    if (recipientProfileId && recipientName) {
      await storeEmailHistory(
        session.user.id,
        recipientProfileId,
        recipientName,
        to,
        subject,
        body
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}
