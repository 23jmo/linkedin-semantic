import { createClient } from "@supabase/supabase-js";
import { chunkProfile } from "../frontend/src/lib/server/profile-chunking";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

async function migrateProfiles() {
  console.log("Starting profile chunk migration...");

  // Fetch all profiles
  const { data: profiles, error } = await supabase.from("profiles").select("*");

  if (error) {
    console.error("Failed to fetch profiles:", error);
    return;
  }

  console.log(`Processing ${profiles.length} profiles...`);

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (profile) => {
        try {
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
            console.error(
              `Failed to store chunks for profile ${profile.id}:`,
              chunksError
            );
          } else {
            console.log(
              `Processed profile ${profile.id}: ${chunks.length} chunks`
            );
          }
        } catch (error) {
          console.error(`Error processing profile ${profile.id}:`, error);
        }
      })
    );

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("Migration complete!");
}

// Run migration
migrateProfiles().catch(console.error);
