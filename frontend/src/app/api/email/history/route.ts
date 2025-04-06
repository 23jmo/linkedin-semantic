import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEmailHistory } from "@/lib/server/email-credentials";

export async function GET() {
  try {
    // Get the current session
    const session = await auth();
    console.log("Email History - Session:", session);

    if (!session?.user?.id) {
      console.log("Email History - No session or user ID found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get email history for the current user
    console.log("Email History - Fetching history for user:", session.user.id);
    const history = await getEmailHistory(session.user.id);
    console.log("Email History - Found entries:", history.length);

    return NextResponse.json({ history });
  } catch (error) { 
    console.error("Error fetching email history:", error);
    return NextResponse.json(
      { error: "Failed to fetch email history" },
      { status: 500 }
    );
  }
}
