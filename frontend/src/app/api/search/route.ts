import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SearchQuerySchema } from "@/types/types";
import { generateEmbedding } from "@/lib/server/embeddings";
import { generateHydeChunks } from "@/lib/server/hyde";
import type { Database } from "@/types/linkedin-profile.types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

type ProfileResult = {
  id: string;
  user_id: string;
  linkedin_id: string;
  full_name: string;
  headline: string;
  industry: string;
  location: string;
  profile_url: string;
  profile_picture_url: string;
  summary: string;
  raw_profile_data: any;
  created_at: string;
  updated_at: string;
  similarity: number;
};

async function semantic_search(
  query: string,
  match_limit: number = 10,
  match_threshold: number = 0.5
) {
  // Generate HyDE chunks for the query
  const hydeChunks = await generateHydeChunks(query);

  // Search with each chunk and combine results
  const chunkResults = await Promise.all(
    hydeChunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.content);
      const embedding_list = embedding.map((x) => Number(x));

      const { data: profiles, error } = await supabase.rpc(
        "search_profiles_by_chunk_embedding",
        {
          query_embedding: embedding_list,
          chunk_type: chunk.chunk_type,
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
    profiles.forEach((profile: ProfileResult) => {
      const current = profileScores.get(profile.id) || {
        profile,
        totalScore: 0,
        count: 0,
      };

      // Weight different chunk types differently
      const weight =
        chunk_type === "experience" ? 1.2 : chunk_type === "skills" ? 1.1 : 1.0;

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
      ...profile,
      similarity: totalScore / count, // Use average score
    }))
    .sort((a, b) => b.similarity - a.similarity)
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

    const { query, match_limit, match_threshold } = result.data;
    const { data, error } = await semantic_search(
      query,
      match_limit,
      match_threshold
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
