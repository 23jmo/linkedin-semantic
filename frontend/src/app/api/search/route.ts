import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SearchQuerySchema } from "@/types/types";
import { generateEmbedding } from "@/lib/server/embeddings";
import OpenAI from "openai";
import type { Database } from "@/types/linkedin-profile.types";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract the return type from the Database type
type SearchProfilesByEmbeddingResult =
  Database["linkedin_profiles"]["Functions"]["search_profiles_by_embedding"]["Returns"][number];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const result = SearchQuerySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { query, match_limit, match_threshold } = result.data;

    // Generate embedding for the search query
    const { data, error } = await semantic_search(
      query,
      match_limit,
      match_threshold
    );

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    // console.log("Data:", data);

    // Transform to match SearchResult type
    const results =
      data?.map((profile: SearchProfilesByEmbeddingResult) => ({
        profile: {
          id: profile.id,
          user_id: profile.user_id,
          linkedin_id: profile.linkedin_id || "",
          full_name: profile.full_name,
          headline: profile.headline || "",
          industry: profile.industry || "",
          location: profile.location || "",
          profile_url: profile.profile_url || "",
          profile_picture_url: profile.profile_picture_url || "",
          summary: profile.summary || "",
          raw_profile_data: profile.raw_profile_data || {},
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        score: profile.similarity,
        highlights: [], // Add highlights if you implement them later
      })) || [];

    // console.log("Search Results:", results);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in semantic search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function semantic_search(
  query: string,
  match_limit: number = 10,
  match_threshold: number = 0.5
) {
  // Generate hypothetical answer using GPT
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a LinkedIn profile expert. Generate a hypothetical ideal profile section of the form 
          
          {
            full_name: z.string(),
            first_name: z.string(),
            last_name: z.string(),
            headline: z.string(),
            summary: z.string(),
            profile_pic_url: z.string(),
            background_cover_image_url: z.string(),
            public_identifier: z.string(),

            city: z.string().nullable(),
            state: z.string().nullable(),
            country: z.string().nullable(),
            country_full_name: z.string().nullable(),

            industry: z.string().nullable(),
            occupation: z.string().nullable(),
            experiences: z.array(z.any()),
            education: z.array(z.any()),
            certifications: z.array(z.any()),
            skills: z.array(z.any()),

            connections: z.number(),
            follower_count: z.number(),
            people_also_viewed: z.array(z.any()),

            languages: z.array(z.any()),
            interests: z.array(z.any()),
            volunteer_work: z.array(z.any()),
            groups: z.array(z.any()),

            accomplishment_courses: z.array(z.any()),
            accomplishment_honors_awards: z.array(z.any()),
            accomplishment_patents: z.array(z.any()),
            accomplishment_projects: z.array(z.any()),
            accomplishment_publications: z.array(z.any()),
            accomplishment_organisations: z.array(z.any()),
            accomplishment_test_scores: z.array(z.any()),

            articles: z.array(z.any()),
            activities: z.array(z.any()),
            recommendations: z.array(z.any()),
            similarly_named_profiles: z.array(z.any()),
            personal_emails: z.array(z.string()),
            personal_numbers: z.array(z.string()),
            inferred_salary: z.number().nullable(),
            birth_date: z.string().nullable(),
            gender: z.string().nullable(),
            extra: z.any().nullable(),
          }
          
          that would perfectly match this search query. Be brief but specific.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.3,
    max_tokens: 150,
  });

  // Use the hypothetical answer for embedding
  const hypotheticalAnswer = completion.choices[0].message.content || query;
  const embedding = await generateEmbedding(hypotheticalAnswer);

  // Ensure embedding is an array of numbers
  const embedding_list = embedding.map((x) => Number(x));

  // Perform semantic search using Supabase's pgvector
  const { data: profiles, error } = await supabase.rpc(
    "search_profiles_by_embedding",
    {
      query_embedding: embedding_list,
      match_threshold: Number(match_threshold),
      match_count: Number(match_limit),
    }
  );

  if (error) {
    throw new Error(`Semantic search error: ${error.message}`);
  }

  return {
    data: profiles,
    error: error,
  };
}
