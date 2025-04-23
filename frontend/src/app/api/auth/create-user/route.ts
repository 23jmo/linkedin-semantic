import { NextRequest, NextResponse } from "next/server";
import {
  ProfileCreateRequestSchema,
  ProfileCreateResponseSchema,
  AuthData,
  ProfileData,
  Profile,
  RawProfile,
  Education,
  Experience,
  Certification,
  Project,
} from "@/types/types";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import { generate_embedding } from "@/utilities/generate-embeddings";
import { chunkProfile } from "@/lib/server/profile-chunking";
import { cookies } from "next/headers";
import { isValidReferralCode } from "@/lib/referral";
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
    if (
      !linkedin_url_to_fetch.match(
        /^https:\/\/www\.linkedin\.com\/[a-zA-Z0-9\/-]+$/
      )
    ) {
      console.log("Invalid LinkedIn URL format:", linkedin_url_to_fetch);
      return NextResponse.json(
        {
          error:
            "Invalid LinkedIn URL format. URL must be of the form 'https://www.linkedin.com/<profile-id>'",
        },
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

    const raw_profile_data: RawProfile = {
      ...proxycurl_linkedin_profile,
    };

    // Prepare profile data
    const profile: Profile = {
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
      raw_profile_data: raw_profile_data,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    console.log("Generating embedding...");

    const embedding = await generate_embedding(raw_profile_data);

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

      // --- Start: Insert related profile data ---

      // Helper function to insert related data
      const insertRelatedData = async <T>(
        tableName: string,
        data: T[],
        mapper: (item: T) => Record<string, unknown>
      ) => {
        if (!data || data.length === 0) {
          console.log(`No data to insert for ${tableName}`);
          return;
        }
        try {
          const mappedData = data.map(mapper);
          // Log the data being inserted for debugging
          console.log(
            `Attempting to insert into ${tableName}:`,
            JSON.stringify(mappedData, null, 2)
          );

          // --- Start: Conditional one-by-one insert for experience ---
          if (tableName === "experience") {
            console.log("Inserting experience records one by one...");
            for (const record of mappedData) {
              const { error: singleInsertError } = await supabase
                .from("experience")
                .insert(record);
              if (singleInsertError) {
                console.error(
                  `Failed to store single experience record:`,
                  record
                );
                // Also log the raw error object for better debugging
                console.error("Supabase error details:", singleInsertError);
                // Throw the specific error to be caught by the outer catch block
                throw singleInsertError;
              }
            }
            // If loop completes without error
            console.log(`${tableName} stored successfully (one by one)`);
          } else {
            // Original batch insert for other tables
            const { error } = await supabase.from(tableName).insert(mappedData);
            if (error) {
              // Log more details about the Supabase error object
              console.error(`Failed to store ${tableName}:`, {
                // Log the raw error object first
                rawError: error,
                message: error.message, // Log standard message property
                details: error.details, // Log details property
                hint: error.hint, // Log hint property
                code: error.code, // Log code property
                fullErrorString: JSON.stringify(error, null, 2), // Log full string representation
              });
              // Decide if this should be a critical error or just logged
              // Optionally re-throw if it's critical
              // throw error;
            } else {
              console.log(`${tableName} stored successfully`);
            }
          }
          // --- End: Conditional one-by-one insert for experience ---
        } catch (err: unknown) {
          // Use unknown for caught errors
          // Log more detailed error information
          console.error(`Raw error object caught for ${tableName}:`, err);

          // Type guard to check if it's a PostgrestError or a standard Error
          if (
            err &&
            typeof err === "object" &&
            ("message" in err ||
              "details" in err ||
              "hint" in err ||
              "code" in err)
          ) {
            // It looks like a PostgrestError or similar object
            const pgError = err as Partial<PostgrestError>; // Cast safely
            console.error(`Error processing ${tableName}:`, {
              message: pgError.message ?? "N/A",
              details: pgError.details ?? "N/A",
              hint: pgError.hint ?? "N/A",
              code: pgError.code ?? "N/A",
              fullError: JSON.stringify(err, null, 2),
            });
          } else if (err instanceof Error) {
            // It's a standard Error
            console.error(`Error processing ${tableName}:`, {
              message: err.message,
              fullError: JSON.stringify(err, null, 2),
            });
          } else {
            // It's something else
            console.error(
              `Caught an unexpected error type for ${tableName}:`,
              err
            );
            console.error(`Error processing ${tableName}:`, {
              fullError: JSON.stringify(err, null, 2),
            });
          }
        }
      };

      await insertRelatedData<Experience>(
        "experience",
        proxycurl_linkedin_profile?.experiences || [],
        (exp) => ({
          profile_id: profileData.id,
          company: exp.company,
          title: exp.title,
          starts_at_day: exp.start_at?.day,
          starts_at_month: exp.start_at?.month,
          starts_at_year: exp.start_at?.year,
          ends_at_day: exp.ends_at?.day,
          ends_at_month: exp.ends_at?.month,
          ends_at_year: exp.ends_at?.year,
          description: exp.description,
          location: exp.location,
          logo_url: exp.logo_url,
          company_facebook_profile_url: exp.company_facebook_profile_url,
          company_linkedin_profile_url: exp.company_linkedin_profile_url,
        })
      );

      // Insert Education
      await insertRelatedData<Education>(
        "education",
        proxycurl_linkedin_profile?.education || [],
        (edu) => ({
          profile_id: profileData.id,
          school: edu.school,
          degree_name: edu.degree_name,
          field_of_study: edu.field_of_study,
          starts_at_day: edu.starts_at?.day,
          starts_at_month: edu.starts_at?.month,
          starts_at_year: edu.starts_at?.year,
          ends_at_day: edu.ends_at?.day,
          ends_at_month: edu.ends_at?.month,
          ends_at_year: edu.ends_at?.year,
          description: edu.description,
          activities_and_societies: edu.activities_and_societies,
          grade: edu.grade,
          logo_url: edu.logo_url,
          school_linkedin_profile_url: edu.school_linkedin_profile_url,
          // ensure created_at and updated_at are handled by db default or add here
        })
      );

      // Insert Skills
      await insertRelatedData<string>(
        "skills",
        proxycurl_linkedin_profile?.skills || [],
        (skill) => ({
          profile_id: profileData.id,
          skill: skill,
          // ensure created_at and updated_at are handled by db default or add here
        })
      );

      // Insert Certifications
      await insertRelatedData<Certification>(
        "certifications",
        proxycurl_linkedin_profile?.certifications || [],
        (cert) => ({
          profile_id: profileData.id,
          name: cert.name,
          // ensure created_at and updated_at are handled by db default or add here
        })
      );

      // Insert Projects
      await insertRelatedData<Project>(
        "projects",
        proxycurl_linkedin_profile?.accomplishment_projects || [], // Assuming proxycurl uses this field name
        (proj) => ({
          profile_id: profileData.id,
          title: proj.title,
          description: proj.description,
          url: proj.url,
          starts_at_day: proj.starts_at?.day,
          starts_at_month: proj.starts_at?.month,
          starts_at_year: proj.starts_at?.year,
          ends_at_day: proj.ends_at?.day,
          ends_at_month: proj.ends_at?.month,
          ends_at_year: proj.ends_at?.year,
          // ensure created_at and updated_at are handled by db default or add here
        })
      );

      // --- End: Insert related profile data ---

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

      console.log("Profile chunks stored successfully");

      // Return success response
      // Validate response against ProfileCreateResponseSchema
      const response = {
        success: true,
        message: "User profile created successfully",
      };

      // Ensure response matches the schema
      const validatedResponse = ProfileCreateResponseSchema.parse(response);

      //check for referral code
      const cookieStore = await cookies();
      const referralCode = cookieStore.get("referral_code")?.value;

      if (referralCode) {
        console.log("Referral code:", referralCode);
        // reward the user

        if (isValidReferralCode(referralCode)) {
          console.log("Valid referral code:", referralCode);
          // reward the user
          const { data: referrerData, error: referrerError } = await supabase
            .from("referrals")
            .select("referrer_id")
            .eq("referral_code", referralCode)
            .single();

          if (referrerError) {
            console.error("Error fetching referrer:", referrerError);
          }

          const { data: referralData, error: referralError } = await supabase
            .from("referred")
            .insert({
              referred_id: user_id,
              referrer_id: referrerData?.referrer_id || "",
              referral_code: referralCode,
              created_at: now,
              completed_at: now,
            });

          if (referralError) {
            console.error(
              "Error storing referral:",
              referralError + " " + referralData
            );
          }
          console.log("Referral stored successfully");
        } else {
          console.log("Invalid referral code:", referralCode);
        }
      }

      return NextResponse.json(validatedResponse, { status: 200 });
    } catch (error: unknown) {
      // Use unknown here too
      console.error("Error in profile creation process:", error);
      // Handle error similarly if needed, check type before accessing properties
      let errorMessage = "Failed to create user profile";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === "string") {
        errorMessage += `: ${error}`;
      }
      return NextResponse.json(
        { error: errorMessage, rawError: error }, // Optionally include raw error
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    // And here
    console.error("Outer error handler:", error);
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    } else if (typeof error === "string") {
      errorMessage += `: ${error}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

  if (!response.ok) {
    // Consider creating a custom error class for better handling
    const errorBody = await response.text();
    console.error(
      `Error fetching LinkedIn profile (${response.status}): ${response.statusText}`,
      errorBody
    );
    throw new Error(`Failed to fetch LinkedIn profile (${response.status})`);
  }

  const data = await response.json();
  // TODO: Add validation here using a Zod schema for the Proxycurl response
  return { proxycurl_linkedin_profile: data };
}

async function verify_profile_match(
  auth_data: AuthData,
  profile_data: ProfileData | null // Allow profile_data to be potentially null
) {
  // Check if profile_data is actually fetched
  if (!profile_data) {
    console.warn(
      "Cannot verify profile match: Profile data is null or undefined."
    );
    // Depending on requirements, you might throw an error here or allow it
    // For now, let's log a warning and proceed, assuming verification isn't strictly required if data is missing
    return;
    // throw new Error("Failed to fetch profile data for verification");
  }

  // Compare email addresses if available
  const auth_email = auth_data?.email?.toLowerCase() || "";
  // Safely access profile email
  const profile_email = profile_data?.email?.toLowerCase() || "";

  if (auth_email && profile_email && auth_email !== profile_email) {
    console.log(`Email mismatch: auth=${auth_email}, profile=${profile_email}`);
    throw new Error(
      "LinkedIn profile email does not match authentication email"
    );
  }

  // Compare names as fallback
  const auth_name = auth_data?.name?.toLowerCase() || "";
  // Safely access profile full_name
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
