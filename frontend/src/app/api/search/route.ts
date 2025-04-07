import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SearchQuerySchema } from "@/types/types";
import { generateEmbedding } from "@/lib/server/embeddings";
import { generateHydeChunks } from "@/lib/server/hyde";
import type { Database } from "@/types/linkedin-profile.types";
import { ProfileChunkType } from "@/types/profile-chunks";

// Initialize OpenAI

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
          ? 1.5
          : chunk_type === "experience"
          ? 1.5
          : chunk_type === "education"
          ? 1.5
          : chunk_type === "achievements"
          ? 1.2
          : 1.0;

      profileScores.set(profile.id, {
        profile,
        totalScore: current.totalScore + profile.similarity * weight,
        count: current.count + 1,
      });
    });
  });

  // Sort by average weighted scores and return top results
  const results = Array.from(profileScores.values())
    .map(({ profile, totalScore, count }) => ({
      profile: {
        ...profile,
      },
      score: totalScore / count,
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
