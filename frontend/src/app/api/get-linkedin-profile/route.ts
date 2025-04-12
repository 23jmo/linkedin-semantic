import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  GetLinkedInProfileRequestSchema,
  GetLinkedInProfileResponseSchema,
} from "@/types/types";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client without schema specification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const req = GetLinkedInProfileRequestSchema.safeParse(body);

    if (!req.success) {
      console.error("Invalid request:", req.error);
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch profile from Supabase
    const { data, error } = await supabase
      .from("profiles") // Make sure this table name matches your Supabase setup
      .select(
        `
        id,
        user_id,
        linkedin_id,
        full_name,
        headline,
        industry,
        location,
        profile_url,
        profile_picture_url,
        summary,
        raw_profile_data,
        created_at,
        updated_at
      `
      )
      .eq("user_id", req.data.user_id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Error fetching LinkedIn profile" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Validate response data
    try {
      // Transform the data to match the schema
      const transformedData = {
        ...data,
        raw_profile_data: {
          ...data.raw_profile_data,
          experiences:
            data.raw_profile_data?.experiences?.map((exp: any) => ({
              ...exp,
              start_at: exp.start_at || { year: new Date().getFullYear() },
              ends_at: exp.ends_at || null,
            })) || [],
          education:
            data.raw_profile_data?.education?.map((edu: any) => ({
              ...edu,
              degree_name: edu.degree_name || null,
              field_of_study: edu.field_of_study || null,
              starts_at: edu.starts_at || { year: new Date().getFullYear() },
              ends_at: edu.ends_at || null,
            })) || [],
        },
      };

      const res = GetLinkedInProfileResponseSchema.parse({
        linkedin_profile: transformedData,
      });
      return NextResponse.json(res);
    } catch (e) {
      console.error("Response validation error:", e);
      return NextResponse.json(
        { error: "Invalid profile data format", details: e },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
