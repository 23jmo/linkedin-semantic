import { NextResponse } from "next/server";
import { hasGmailConnected } from "@/lib/server/gmail-service";
import { auth } from "@/auth";

export async function GET() {
  console.log("[API] GET /api/gmail/check-connection - Request received");

  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log(
        "[API] GET /api/gmail/check-connection - Unauthorized: No session or user ID"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log(
      `[API] GET /api/gmail/check-connection - Checking connection for user: ${session.user.id}`
    );
    const isConnected = await hasGmailConnected(session.user.id);

    console.log(
      `[API] GET /api/gmail/check-connection - Connection status: ${isConnected}`
    );
    return NextResponse.json({ isConnected });
  } catch (error) {
    console.error("[API] GET /api/gmail/check-connection - Error:", error);
    return NextResponse.json(
      { error: "Failed to check Gmail connection" },
      { status: 500 }
    );
  }
}
