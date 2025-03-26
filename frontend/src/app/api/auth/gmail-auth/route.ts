import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/gmail-auth/callback`
);

// Generate authorization URL
export async function GET(request: NextRequest) {
  console.log("[API] GET /api/auth/gmail-auth - Request received");

  try {
    // Check if user is authenticated with LinkedIn
    const session = await auth();
    if (!session?.user?.id) {
      console.log(
        "[API] GET /api/auth/gmail-auth - Unauthorized: No session or user ID"
      );
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in with LinkedIn first.",
        },
        { status: 401 }
      );
    }

    // Get the returnTo path from query params or use current path as default
    const returnTo =
      request.nextUrl.searchParams.get("returnTo") ||
      request.headers
        .get("referer")
        ?.replace(process.env.NEXTAUTH_URL || "", "") ||
      "/";

    console.log(`[API] GET /api/auth/gmail-auth - Return path: ${returnTo}`);

    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent", // Force to show the consent screen
      state: JSON.stringify({ userId: session.user.id, returnTo }), // Pass both user ID and return path
    });

    console.log(
      `[API] GET /api/auth/gmail-auth - Generated auth URL for user: ${session.user.id}`
    );
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("[API] GET /api/auth/gmail-auth - Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Gmail authorization URL" },
      { status: 500 }
    );
  }
}
