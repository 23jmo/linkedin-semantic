import { NextResponse } from "next/server";
import { hasGmailConnected } from "@/lib/server/gmail-service";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const isConnected = await hasGmailConnected(session.user.id);

    return NextResponse.json({ isConnected });
  } catch (error) {
    console.error("Error checking Gmail connection:", error);
    return NextResponse.json(
      { error: "Failed to check Gmail connection" },
      { status: 500 }
    );
  }
}
