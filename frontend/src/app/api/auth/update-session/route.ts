import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Update session request body:", body);

    // We can't directly update the session from the server,
    // but we can return a response that tells the client to refresh the session

    return NextResponse.json({
      success: true,
      message: "Session update requested. Please refresh the session.",
      // Include the updated values so the client can use them immediately if needed
      exists: body.exists,
      needsProfile: body.needsProfile,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
