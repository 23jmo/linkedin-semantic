import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
).schema("next_auth");

// Server API key for internal requests
const SERVER_API_KEY = process.env.SERVER_API_KEY || "internal-api-key";

/**
 * API route to fetch a user's email from the next_auth.users table
 * @route POST /api/get-user-email
 */
export async function POST(request: NextRequest) {
  try {
    // Check for server API key in headers
    const apiKey = request.headers.get("x-api-key");
    const isServerRequest = apiKey === SERVER_API_KEY;

    // If not a server request, authenticate the user
    if (!isServerRequest) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Parse the request body
    const { profileId } = await request.json();

    // Validate required fields
    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Log the request
    console.log(`[get-user-email] Fetching email for profile ID: ${profileId}`);

    // Query the next_auth.users table
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", profileId)
      .single();

    // Handle database errors
    if (error) {
      console.error("[get-user-email] Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch user email" },
        { status: 500 }
      );
    }

    // Return the email if found
    if (data && data.email) {
      console.log(`[get-user-email] Email found for profile ID: ${profileId}`);
      return NextResponse.json({ email: data.email });
    }

    // No email found
    console.log(`[get-user-email] No email found for profile ID: ${profileId}`);
    return NextResponse.json(
      { error: "Email not found for the provided profile ID" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[get-user-email] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
