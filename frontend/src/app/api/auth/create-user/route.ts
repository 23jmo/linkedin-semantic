import { NextRequest, NextResponse } from "next/server";
import {
  ProfileCreateRequestSchema,
  ProfileCreateResponseSchema,
  AuthData,
  ProfileData,
} from "@/types/types";
import { createClient } from "@supabase/supabase-js";
import { generate_embedding } from "@/utilities/generate-embeddings";
import { chunkProfile } from "@/lib/server/profile-chunking";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = ProfileCreateRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { user_id, linkedin_auth, linkedin_url } = result.data;

    console.log("Fetching LinkedIn profile...");
    let linkedin_url_to_fetch = linkedin_url;
    if (linkedin_url_to_fetch.startsWith("linkedin.com")) {
      linkedin_url_to_fetch = "https://www." + linkedin_url_to_fetch;
    }
    
    // Validate LinkedIn URL format
    if (!linkedin_url_to_fetch.match(/^https:\/\/www\.linkedin\.com\/[a-zA-Z0-9\/-]+$/)) {
      console.log("Invalid LinkedIn URL format:", linkedin_url_to_fetch);
      return NextResponse.json(
        { error: "Invalid LinkedIn URL format. URL must be of the form 'https://www.linkedin.com/<profile-id>'" },
        { status: 400 }
      );
    }

    console.log("Fetching LinkedIn profile...: ", linkedin_url_to_fetch);

    const { proxycurl_linkedin_profile } = await fetch_linkedin_profile(
      linkedin_url_to_fetch
    );

    console.log(
      "LinkedIn profile:",
      JSON.stringify(proxycurl_linkedin_profile).substring(0, 200) + "..."
    );

    if (linkedin_auth) {
      await verify_profile_match(linkedin_auth, proxycurl_linkedin_profile);
    } else {
      console.log("No LinkedIn authentication data provided");
      return NextResponse.json(
        { error: "No LinkedIn authentication data provided" },
        { status: 400 }
      );
    }

    //works until here
    // Safely build the location string
    const location_parts = [
      proxycurl_linkedin_profile?.country_full_name || "",
      proxycurl_linkedin_profile?.city || "",
      proxycurl_linkedin_profile?.state || "",
      proxycurl_linkedin_profile?.postal_code || "",
    ];
    // Filter out empty parts and join with spaces
    const location = location_parts.filter((part) => part).join(" ");

    // Generate a UUID for the profile
    const profile_id = crypto.randomUUID();

    // Create timestamp for created_at and updated_at
    const now = new Date();

    // Prepare profile data
    const profile = {
      id: profile_id,
      user_id: user_id,
      linkedin_id: "",
      full_name: proxycurl_linkedin_profile?.full_name || "",
      headline: proxycurl_linkedin_profile?.headline || "",
      industry: proxycurl_linkedin_profile?.industry || "",
      location: location,
      profile_url: linkedin_url_to_fetch,
      profile_picture_url: proxycurl_linkedin_profile?.profile_pic_url || "",
      summary: proxycurl_linkedin_profile?.summary || "",
      raw_profile_data: proxycurl_linkedin_profile,
      created_at: now,
      updated_at: now,
    };

    console.log("Generating embedding...");

    const embedding = await generate_embedding(profile.raw_profile_data);

    try {
      // Store the profile in Supabase
      const { data: profileData, error: insertError } = await supabase
        .from("profiles")
        .insert(profile)
        .select()
        .single();
      if (insertError) {
        console.error("Error storing profile:", insertError);
        return NextResponse.json(
          { error: "Failed to store profile data" },
          { status: 500 }
        );
      }

      // Create embedding data with the correct profile_id
      const validatedEmbedding = {
        id: crypto.randomUUID(),
        profile_id: profileData.id, // Use the actual profile ID
        embedding: embedding,
        embedding_model: "openai",
        created_at: now,
      };

      // Store the embedding
      const { error: embeddingError } = await supabase
        .from("profile_embeddings")
        .insert(validatedEmbedding);
      if (embeddingError) {
        console.error("Error storing embedding:", embeddingError);
        return NextResponse.json(
          { error: "Failed to store embedding data: " + embeddingError },
          { status: 500 }
        );
      }

      // Generate and store chunks
      const chunks = await chunkProfile(profile);

      const { error: chunksError } = await supabase
        .from("profile_chunks")
        .upsert(
          chunks.map((chunk) => ({
            profile_id: profile.id,
            chunk_type: chunk.chunk_type,
            content: chunk.content,
            embedding: chunk.embedding,
          })),
          { onConflict: "profile_id,chunk_type" }
        );

      if (chunksError) {
        console.error("Failed to store profile chunks:", chunksError);
        // Don't throw - profile is still usable even if chunks fail
      }

      // Return success response
      // Validate response against ProfileCreateResponseSchema
      const response = {
        success: true,
        message: "User profile created successfully",
      };

      // Ensure response matches the schema
      const validatedResponse = ProfileCreateResponseSchema.parse(response);

      return NextResponse.json(validatedResponse, { status: 200 });
    } catch (error) {
      console.error("Error in profile creation:", error);
      return NextResponse.json(
        { error: "Failed to create user profile: " + error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in profile creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function fetch_linkedin_profile(linkedin_url: string) {
  const headers = {
    Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}`,
  };

  const params = new URLSearchParams({
    linkedin_profile_url: linkedin_url,
  });

  const response = await fetch(
    `https://nubela.co/proxycurl/api/v2/linkedin?${params.toString()}`,
    {
      method: "GET",
      headers: headers,
    }
  );

  const data = await response.json();
  return { proxycurl_linkedin_profile: data };
}

async function verify_profile_match(
  auth_data: AuthData,
  profile_data: ProfileData
) {
  // Compare email addresses if available
  const auth_email = auth_data?.email?.toLowerCase() || "";
  const profile_email = profile_data?.email?.toLowerCase() || "";

  if (auth_email && profile_email && auth_email !== profile_email) {
    console.log(`Email mismatch: auth=${auth_email}, profile=${profile_email}`);
    throw new Error(
      "LinkedIn profile email does not match authentication email"
    );
  }

  // Compare names as fallback
  const auth_name = auth_data?.name?.toLowerCase() || "";
  const profile_name = profile_data?.full_name?.toLowerCase() || "";

  if (auth_name && profile_name && auth_name !== profile_name) {
    console.log(`Name mismatch: auth=${auth_name}, profile=${profile_name}`);
    throw new Error("LinkedIn profile name does not match authentication name");
  }

  console.log("Profile verification passed!!!");
}

// export async function POST(request: NextRequest) {
//   try {
//     // Parse the request body
//     const body = await request.json();

//     // Validate LinkedIn URL if user doesn't exist
//     if (!body.linkedin_url) {
//       console.error("LinkedIn URL is required");
//       return NextResponse.json(
//         { error: "LinkedIn URL is required" },
//         { status: 400 }
//       );
//     }

//     // Forward the request to the FastAPI backend
//     const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

//     const response = await fetch(`${backendUrl}/api/v1/profiles/create-user`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body),
//     });

//     // Check if the response is ok
//     if (!response.ok) {
//       console.error(`Backend returned status ${response.status}`);
//       const errorText = await response.text();
//       console.error(`Error response: ${errorText}`);
//       return NextResponse.json(
//         { error: "Failed to create user" },
//         { status: response.status }
//       );
//     }

//     // Return the response from the backend
//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error("Error in create-user API route:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
