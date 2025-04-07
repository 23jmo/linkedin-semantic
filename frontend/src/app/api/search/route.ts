import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SearchQuerySchema } from "@/types/types";
import { generateEmbedding } from "@/lib/server/embeddings";
import { generateHydeChunks } from "@/lib/server/hyde";
import type { Database } from "@/types/linkedin-profile.types";
import { ProfileChunkType } from "@/types/profile-chunks";

// Initialize OpenAI

// --- Levenshtein Distance Function ---
// Calculates the minimum number of single-character edits (insertions, deletions, or substitutions)
// required to change one word into the other.
function levenshteinDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array(s2.length + 1);
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

// Function to check if a keyword fuzzily matches any word in a text
function fuzzyCheck(
  text: string,
  keyword: string,
  threshold: number = 2
): boolean {
  if (!text || !keyword) return false;
  const words = text.toLowerCase().split(/\\s+/); // Split text into words
  return words.some((word) => levenshteinDistance(word, keyword) <= threshold);
}
// --- End Levenshtein Distance ---

// Extract the return type from the Database type
type SearchProfilesByEmbeddingResult =
  Database["linkedin_profiles"]["Functions"]["search_profiles_by_embedding"]["Returns"][number];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

async function semantic_search(
  query: string,
  match_limit: number = 10,
  match_threshold: number = 0.5,
  useHyde: boolean = true
) {
  let searchChunks: { chunk_type: ProfileChunkType; content: string }[];

  if (useHyde) {
    // Generate HyDE chunks for the query
    searchChunks = await generateHydeChunks(query);
  } else {
    // Use the raw query for all relevant chunk types (you might adjust this)
    searchChunks = [
      "basic_info",
      "summary",
      "experience",
      "skills",
      "education",
      "achievements",
    ].map((type) => ({ chunk_type: type as ProfileChunkType, content: query }));
  }

  // Search with each chunk and combine results
  const chunkResults = await Promise.all(
    searchChunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.content);
      const embedding_list = embedding.map((x) => Number(x));

      const { data: profiles, error } = await supabase.rpc(
        "search_profiles_by_chunk_embedding",
        {
          query_embedding: embedding_list,
          target_chunk_type: chunk.chunk_type,
          match_threshold: Number(match_threshold),
          match_count: Number(match_limit),
        }
      );

      if (error) throw new Error(`Semantic search error: ${error.message}`);
      return { chunk_type: chunk.chunk_type, profiles };
    })
  );

  // Combine and deduplicate results
  const profileScores = new Map<
    string,
    { profile: any; totalScore: number; count: number }
  >();

  // Extract keywords once before the loop
  const queryKeywords = query
    .toLowerCase()
    .split(/\\s+/)
    .filter((kw) => kw.length > 0); // Filter out empty strings

  chunkResults.forEach(({ chunk_type, profiles }) => {
    profiles.forEach((profile: SearchProfilesByEmbeddingResult) => {
      const current = profileScores.get(profile.id) || {
        profile,
        totalScore: 0,
        count: 0,
      };

      // Weight different chunk types differently
      const weight =
        chunk_type === "basic_info"
          ? 3
          : chunk_type === "experience"
          ? 1.5
          : chunk_type === "education"
          ? 1.5
          : chunk_type === "achievements"
          ? 1.2
          : 0.5;

      // --- Fuzzy Keyword Boosting Logic (Applied to ALL chunks) ---
      let keywordBoost = 1.0; // Default: no boost
      const FUZZY_THRESHOLD = 2; // Max Levenshtein distance for a match
      const BOOST_FACTOR = 1.2; // Slight boost factor

      // Get the relevant text based on chunk_type (adjust field names as needed)
      let profileText = "";
      try {
        switch (chunk_type) {
          case "basic_info":
            profileText = `${profile.full_name || ""} ${
              profile.headline || ""
            } ${profile.location || ""}`; // Combine relevant basic info fields
            break;
          case "summary":
            profileText =
              profile.summary_text || JSON.stringify(profile.summary) || ""; // Assuming summary text is available
            break;
          case "experience":
            // Combine title, company, description from all experiences if possible
            // This assumes experience_details is an array or object structure you can stringify. Adjust as needed.
            profileText = JSON.stringify(
              profile.experience_details || profile.experience || ""
            );
            break;
          case "skills":
            profileText =
              profile.skills_list_text || JSON.stringify(profile.skills) || ""; // Assuming skills text is available
            break;
          case "education":
            profileText = JSON.stringify(
              profile.education_details || profile.education || ""
            ); // Assuming education data structure
            break;
          case "achievements":
            profileText = JSON.stringify(
              profile.achievement_details || profile.achievements || ""
            ); // Assuming achievement data structure
            break;
          default:
            // Fallback: try to stringify the whole profile? Risky, might be too broad.
            // Or simply don't boost for unknown/unmapped chunk types.
            console.warn(`Unmapped chunk_type for boosting: ${chunk_type}`);
            profileText = "";
        }
      } catch (e) {
        console.error(
          `Error accessing profile text for chunk ${chunk_type}, profile ${profile.id}:`,
          e
        );
        profileText = ""; // Ensure profileText is a string
      }

      if (profileText && queryKeywords.length > 0) {
        // Check if *all* query keywords have a fuzzy match in the profile text for this chunk
        const allKeywordsFoundFuzzily = queryKeywords.every((kw) =>
          fuzzyCheck(profileText, kw, FUZZY_THRESHOLD)
        );

        if (allKeywordsFoundFuzzily) {
          keywordBoost = BOOST_FACTOR; // Apply slight boost
          // console.log(`Fuzzy keyword boost (${BOOST_FACTOR}x) applied to profile ${profile.id} for chunk ${chunk_type}`);
        }
      }
      // --- End Fuzzy Keyword Boosting Logic ---

      // --- Score Calculation & Logging ---
      const chunkScoreContribution = profile.similarity * weight * keywordBoost;

      // Log the profile name (or ID if name is missing) along with score details
      const profileIdentifier =
        profile.full_name || `ID: ${profile.id.substring(0, 8)}`;
      console.log(
        `[Search Score] Profile: ${profileIdentifier.padEnd(
          25
        )} | Chunk: ${chunk_type.padEnd(
          12
        )} | Sim: ${profile.similarity.toFixed(3)} | Weight: ${weight.toFixed(
          1
        )} | Boost: ${keywordBoost.toFixed(
          1
        )} | Score: ${chunkScoreContribution.toFixed(3)}`
      );

      profileScores.set(profile.id, {
        profile,
        // Apply the keyword boost to the similarity score before adding to total
        totalScore: current.totalScore + chunkScoreContribution, // Add the calculated contribution
        count: current.count + 1, // Still increment count normally
      });
    });
  });

  // Sort by average weighted scores and return top results
  const results = Array.from(profileScores.values())
    .map(({ profile, totalScore, count }) => ({
      profile: {
        ...profile,
      },
      score: totalScore,
      highlights: [],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, match_limit);

  return { data: results, error: null };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = SearchQuerySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { query, match_limit, match_threshold, useHyde } = result.data;
    const { data, error } = await semantic_search(
      query,
      match_limit,
      match_threshold,
      useHyde
    );

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json(
        { error: "Failed to search profiles" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
