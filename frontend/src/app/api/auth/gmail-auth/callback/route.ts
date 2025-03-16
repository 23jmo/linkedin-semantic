import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { storeEmailCredentials } from "@/lib/server/email-credentials";

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/gmail-auth/callback`
);

export async function GET(request: NextRequest) {
  console.log("[API] GET /api/auth/gmail-auth/callback - Request received");

  try {
    // Get the authorization code and state (user ID) from the URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    // Parse state parameter to get userId and returnTo
    let userId,
      returnTo = "/";
    try {
      if (stateParam) {
        const stateObj = JSON.parse(stateParam);
        userId = stateObj.userId;
        returnTo = stateObj.returnTo || "/";
        console.log(
          `[API] GET /api/auth/gmail-auth/callback - Parsed state: userId=${userId}, returnTo=${returnTo}`
        );
      }
    } catch (e) {
      // Fallback if state isn't valid JSON (backward compatibility)
      userId = stateParam;
      console.log(
        `[API] GET /api/auth/gmail-auth/callback - Using state directly as userId: ${userId}`
      );
    }

    // Handle errors from Google OAuth
    if (error) {
      console.error(
        `[API] GET /api/auth/gmail-auth/callback - OAuth error: ${error}`
      );
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${returnTo}?error=gmail_auth_failed&reason=${error}`
      );
    }

    // Validate required parameters
    if (!code || !userId) {
      console.error(
        "[API] GET /api/auth/gmail-auth/callback - Missing code or user ID"
      );
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${returnTo}?error=gmail_auth_failed&reason=missing_parameters`
      );
    }

    console.log(
      `[API] GET /api/auth/gmail-auth/callback - Processing code for user: ${userId}`
    );

    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("[API] GET /api/auth/gmail-auth/callback - Tokens received");

    // Validate tokens
    if (!tokens.access_token) {
      console.error(
        "[API] GET /api/auth/gmail-auth/callback - No access token received"
      );
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${returnTo}?error=gmail_auth_failed&reason=no_access_token`
      );
    }

    // Store the credentials in Supabase
    await storeEmailCredentials(
      userId,
      "gmail",
      tokens.access_token,
      tokens.refresh_token || "",
      tokens.expiry_date
        ? Math.floor(tokens.expiry_date / 1000)
        : Math.floor(Date.now() / 1000) + 3600
    );

    console.log(
      `[API] GET /api/auth/gmail-auth/callback - Credentials stored for user: ${userId}`
    );

    // Redirect back to the original page with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}${returnTo}?success=gmail_connected`
    );
  } catch (error) {
    console.error("[API] GET /api/auth/gmail-auth/callback - Error:", error);
    // Default to home page if we can't determine where to return
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=gmail_auth_failed&reason=server_error`
    );
  }
}
