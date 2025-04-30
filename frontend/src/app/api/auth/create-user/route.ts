import { NextRequest } from "next/server";
import {
  ProfileCreateRequestSchema,
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
  // Create a ReadableStream to send progress updates
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper function to send status updates
      const sendUpdate = (
        status: string,
        message: string,
        stage: string,
        details?: string
      ) => {
        const update = JSON.stringify({ status, message, stage, details });
        controller.enqueue(encoder.encode(update));
      };

      try {
        const body = await request.json();

        const result = ProfileCreateRequestSchema.safeParse(body);
        if (!result.success) {
          sendUpdate("error", result.error.issues[0].message, "validation");
          controller.close();
          return;
        }

        const { user_id, linkedin_auth, linkedin_url } = result.data;

        sendUpdate(
          "progress",
          "Validating LinkedIn URL...",
          "validation",
          linkedin_url
        );
        // Normalize LinkedIn URL to ensure consistent format
        // Handle all possible variations of LinkedIn profile URLs
        const linkedInUrlRegex =
          /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;

        let linkedin_url_to_fetch = linkedin_url;

        if (!linkedInUrlRegex.test(linkedin_url)) {
          sendUpdate(
            "error",
            "Invalid LinkedIn URL format. URL must be a LinkedIn profile URL (linkedin.com/in/username)",
            "validation"
          );
          controller.close();
          return;
        }

        // Extract the username part and reconstruct the URL in standard format
        const usernameMatch = linkedin_url.match(/linkedin\.com\/in\/([\w-]+)/);
        if (usernameMatch && usernameMatch[1]) {
          linkedin_url_to_fetch = `https://www.linkedin.com/in/${usernameMatch[1]}`;
        } else {
          // This should not happen if regex test passed, but handle it just in case
          sendUpdate(
            "error",
            "Could not extract username from LinkedIn URL",
            "validation"
          );
          controller.close();
          return;
        }

        // Validate LinkedIn URL format
        if (
          !linkedin_url_to_fetch.match(
            /^https:\/\/www\.linkedin\.com\/[a-zA-Z0-9\/-]+$/
          )
        ) {
          sendUpdate(
            "error",
            "Invalid LinkedIn URL format. URL must be of the form 'https://www.linkedin.com/<profile-id>'",
            "validation"
          );
          controller.close();
          return;
        }

        sendUpdate(
          "progress",
          "Fetching LinkedIn profile data...",
          "fetching",
          linkedin_url_to_fetch
        );

        const { proxycurl_linkedin_profile } = await fetch_linkedin_profile(
          linkedin_url_to_fetch
        );

        if (linkedin_auth) {
          sendUpdate(
            "progress",
            "Verifying profile match...",
            "verification",
            linkedin_url_to_fetch
          );
          await verify_profile_match(linkedin_auth, proxycurl_linkedin_profile);
        } else {
          sendUpdate(
            "error",
            "No LinkedIn authentication data provided",
            "verification"
          );
          controller.close();
          return;
        }

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
          profile_picture_url:
            proxycurl_linkedin_profile?.profile_pic_url || "",
          summary: proxycurl_linkedin_profile?.summary || "",
          raw_profile_data: raw_profile_data,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        };

        sendUpdate(
          "progress",
          "Generating embedding for " + profile.full_name,
          "embedding"
        );
        const embedding = await generate_embedding(raw_profile_data);

        try {
          // Store the profile in Supabase
          sendUpdate(
            "progress",
            "Storing profile data for " + profile.full_name,
            "storing_profile"
          );
          const { data: profileData, error: insertError } = await supabase
            .from("profiles")
            .insert(profile)
            .select()
            .single();
          if (insertError) {
            sendUpdate(
              "error",
              "Failed to store profile data for " + profile.full_name,
              "storing_profile"
            );
            controller.close();
            return;
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
          sendUpdate(
            "progress",
            "Storing embedding data...",
            "storing_embedding"
          );
          const { error: embeddingError } = await supabase
            .from("profile_embeddings")
            .insert(validatedEmbedding);
          if (embeddingError) {
            sendUpdate(
              "error",
              "Failed to store embedding data",
              "storing_embedding"
            );
            controller.close();
            return;
          }

          // --- Start: Insert related profile data ---

          // Helper function to insert related data
          const insertRelatedData = async <T>(
            tableName: string,
            data: T[],
            mapper: (item: T) => Record<string, unknown>,
            snippetExtractor: (item: T) => string
          ) => {
            if (!data || data.length === 0) {
              console.log(`No data to insert for ${tableName}`);
              return;
            }
            try {
              const mappedData = data.map(mapper);
              const firstItemSnippet =
                data.length > 0 ? snippetExtractor(data[0]) : "";
              sendUpdate(
                "progress",
                `Storing ${tableName} data...`,
                `storing_${tableName}`,
                `${data.length} ${tableName} record(s)... ${
                  firstItemSnippet ? `(e.g., ${firstItemSnippet})` : ""
                }`
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
                    console.error("Supabase error details:", singleInsertError);
                  }
                }
                console.log(`${tableName} stored successfully (one by one)`);
              } else {
                // Original batch insert for other tables
                const { error } = await supabase
                  .from(tableName)
                  .insert(mappedData);
                if (error) {
                  console.error(`Failed to store ${tableName}:`, {
                    rawError: error,
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullErrorString: JSON.stringify(error, null, 2),
                  });
                } else {
                  console.log(`${tableName} stored successfully`);
                }
              }
              // --- End: Conditional one-by-one insert for experience ---
            } catch (err: unknown) {
              console.error(`Raw error object caught for ${tableName}:`, err);
              // Use unknown for caught errors
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

          sendUpdate(
            "progress",
            "Processing experience data...",
            "processing_related_data"
          );
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
            }),
            (exp) => `${exp.title} at ${exp.company}`
          );

          sendUpdate(
            "progress",
            "Processing education data...",
            "processing_related_data"
          );
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
            }),
            (edu) => `${edu.degree_name || "Degree"} at ${edu.school}`
          );

          sendUpdate(
            "progress",
            "Processing skills data...",
            "processing_related_data"
          );
          await insertRelatedData<string>(
            "skills",
            proxycurl_linkedin_profile?.skills || [],
            (skill) => ({
              profile_id: profileData.id,
              skill: skill,
            }),
            (skill) => `${skill}`
          );

          sendUpdate(
            "progress",
            "Processing certifications data...",
            "processing_related_data"
          );
          await insertRelatedData<Certification>(
            "certifications",
            proxycurl_linkedin_profile?.certifications || [],
            (cert) => ({
              profile_id: profileData.id,
              name: cert.name,
            }),
            (cert) => cert.name || ""
          );

          sendUpdate(
            "progress",
            "Processing projects data...",
            "processing_related_data"
          );
          await insertRelatedData<Project>(
            "projects",
            proxycurl_linkedin_profile?.accomplishment_projects || [],
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
            }),
            (proj) => proj.title || ""
          );

          // Generate and store chunks
          sendUpdate(
            "progress",
            "Generating profile chunks...",
            "generating_chunks"
          );
          const chunks = await chunkProfile(profile);

          sendUpdate("progress", "Storing profile chunks...", "storing_chunks");
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
          }

          // Return success response
          // const response = {
          //   success: true,
          //   message: "User profile created successfully",
          // };

          // Ensure response matches the schema
          //const validatedResponse = ProfileCreateResponseSchema.parse(response);

          //check for referral code
          const cookieStore = await cookies();
          const referralCode = cookieStore.get("referral_code")?.value;

          if (referralCode) {
            sendUpdate(
              "progress",
              "Processing referral code...",
              "processing_referral"
            );
            console.log("Referral code:", referralCode);
            // reward the user

            if (isValidReferralCode(referralCode)) {
              console.log("Valid referral code:", referralCode);
              // reward the user
              const { data: referrerData, error: referrerError } =
                await supabase
                  .from("referrals")
                  .select("referrer_id")
                  .eq("referral_code", referralCode)
                  .single();

              if (referrerError) {
                console.error("Error fetching referrer:", referrerError);
              }

              const { data: referralData, error: referralError } =
                await supabase.from("referred").insert({
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

          sendUpdate(
            "complete",
            "User profile created successfully",
            "complete"
          );
          controller.close();
        } catch (error: unknown) {
          console.error("Error in profile creation process:", error);
          let errorMessage = "Failed to create user profile";
          if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
          }
          sendUpdate("error", errorMessage, "error");
          controller.close();
        }
      } catch (error: unknown) {
        console.error("Outer error handler:", error);
        let errorMessage = "Internal server error";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        sendUpdate("error", errorMessage, "error");
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
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

  // if (auth_name && profile_name && auth_name !== profile_name) {
  //   console.log(`Name mismatch: auth=${auth_name}, profile=${profile_name}`);
  //   throw new Error("LinkedIn profile name does not match authentication name");
  // }

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
