import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
).schema("linkedin_profiles");

export async function GET() {
  try {
    // Get count of profiles
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error getting profile count:", error);
      return NextResponse.json(
        { error: "Error getting profile count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in profile count endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
