import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEmailHistory } from "@/lib/server/email-credentials";

export async function GET() {
  try {
    // Get the current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get email history for the current user
    const history = await getEmailHistory(session.user.id);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching email history:", error);
    return NextResponse.json(
      { error: "Failed to fetch email history" },
      { status: 500 }
    );
  }
}
