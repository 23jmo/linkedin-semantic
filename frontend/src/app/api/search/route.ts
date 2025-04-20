import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  SearchQuerySchema,
  SearchAndRankResultSchema,
  TransformedSearchResultsSchema,
  SearchAndRankResult,
  SearchAndRankResultRow,
  TransformedSearchResult,
  ScoredSearchResults,
  ScoredSearchResultsSchema,
  TraitScore,
} from "@/types/types";
import { generateEmbedding } from "@/lib/server/embeddings";
import { generateHydeChunks } from "@/lib/server/hyde";
import type { Database } from "@/types/linkedin-profile.types";
import { ProfileChunkType } from "@/types/profile-chunks";
import { RawProfileDataSchema } from "@/types/types";
import { z } from "zod";

import OpenAI from "openai";

import { RawProfile } from "@/types/types";
import { query_prompt } from "./query_prompt";
import { relevant_sections_prompt } from "./relevant_sections_prompt";
import { traits_prompt } from "./traits_prompt";
import { filters_prompt } from "./filters_prompt";
import { key_phrases_prompt } from "./key_phrases_prompt";
import { score_results_prompt } from "./score_results_prompt";

// Define the filter type
interface Filter {
  field: string;
  value: string;
  operator: "=" | "ILIKE" | "@>";
}

// Import the JSON template
// const jsonTemplate = JSON.stringify(RawProfileDataSchema);
// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Define the structure for profile scores map value
interface ProfileScoreInfo {
  profile: SearchProfilesByEmbeddingResult;
  totalScore: number;
  count: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

// Define the response type for relevant sections
interface RelevantSectionsResponse {
  relevant_sections: string[];
  confidence: number;
  reasoning: string;
}

// Define the response type for key phrases
interface KeyPhrase {
  key_phrase: string;
  relevant_section: string;
  confidence: number;
}

interface KeyPhrasesResponse {
  key_phrases: KeyPhrase[];
  reasoning: string;
}

// Define the response type for traits
interface TraitsResponse {
  traits: string[];
  reasoning: string;
}

interface SQLQueryResponse {
  query: string;
  reasoning: string;
}

// Add a semaphore to limit concurrent requests
const MAX_CONCURRENT_REQUESTS = 10;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

async function waitForSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }

  return new Promise<void>((resolve) => {
    requestQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeRequests--;
  const nextRequest = requestQueue.shift();
  if (nextRequest) {
    nextRequest();
  }
}

// Streaming search function
async function advanced_search(
  query: string,
  writer?: WritableStreamDefaultWriter<Uint8Array>
): Promise<SearchProfilesByEmbeddingResult[]> {
  await waitForSlot();

  try {
    // Helper function to write event to the stream
    const writeEvent = async (event: string, data: any) => {
      if (writer) {
        await writer.write(
          new TextEncoder().encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          )
        );
      }
    };

    // Step 1: Relevant sections
    await writeEvent("step", { name: "relevant_sections", status: "started" });
    const relevant_sections = await get_relevant_sections(query);
    console.log("Relevant sections:", relevant_sections);
    await writeEvent("step", {
      name: "relevant_sections",
      status: "completed",
      data: relevant_sections,
    });

    // Step 2: Traits
    await writeEvent("step", { name: "traits", status: "started" });
    const traits = await get_traits(query);
    console.log("Traits:", traits);
    await writeEvent("step", {
      name: "traits",
      status: "completed",
      data: traits,
    });

    // Step 3: Key phrases
    await writeEvent("step", { name: "key_phrases", status: "started" });
    const key_phrases = await get_key_phrases(traits, relevant_sections);
    console.log("Key phrases:", key_phrases);
    await writeEvent("step", {
      name: "key_phrases",
      status: "completed",
      data: key_phrases,
    });

    // Step 4: SQL query
    await writeEvent("step", { name: "sql_query", status: "started" });
    const sql_query = await generate_sql_query([], traits, key_phrases);
    console.log("Generated SQL:", sql_query);
    await writeEvent("step", {
      name: "sql_query",
      status: "completed",
      data: sql_query,
    });

    // Step 5: Execute search
    await writeEvent("step", { name: "search_execution", status: "started" });
    const result = await supabase.rpc("search_and_rank", {
      query_text: sql_query.trim(),
      key_phrases: key_phrases,
    });

    if (result.error) {
      console.error("Supabase RPC error:", result.error);
      await writeEvent("error", {
        message: `Search failed: ${result.error.message}`,
      });
      throw new Error(`Search failed: ${result.error.message}`);
    }

    // Validate the raw data from Supabase RPC using Zod
    const validatedRawData = SearchAndRankResultSchema.safeParse(result.data);

    console.log("validatedRawData:", validatedRawData);

    if (!validatedRawData.success) {
      console.error(
        "Zod validation error (raw data):",
        validatedRawData.error.issues
      );
      await writeEvent("error", {
        message: "Invalid response format from database",
        details: validatedRawData.error.issues, // Optionally include details
      });
      throw new Error("Invalid response format from database");
    }

    // Now use validatedRawData.data for transformation
    const rawResults = validatedRawData.data;

    console.log("rawResults:", rawResults);

    // Transform results to match SearchProfilesByEmbeddingResult type
    const transformedResultsData = rawResults.map(
      (row: SearchAndRankResultRow) => ({
        id: row.id, // id should be guaranteed by SQL and schema
        user_id: row.user_id ?? "", // Use nullish coalescing for potential nulls
        linkedin_id: row.linkedin_id ?? "", // Use nullish coalescing
        full_name: row.full_name ?? "", // Use nullish coalescing
        headline: row.headline ?? "", // Use nullish coalescing
        industry: row.industry ?? "", // Use nullish coalescing
        location: row.location ?? "", // Use nullish coalescing
        profile_url: row.profile_url ?? "", // Use nullish coalescing
        profile_picture_url: row.profile_picture_url ?? "", // Use nullish coalescing
        summary: row.summary ?? "", // Use nullish coalescing
        raw_profile_data: row.raw_profile_data, // Keep raw data
        created_at: row.created_at ?? new Date().toISOString(), // Fallback if null
        updated_at: row.updated_at ?? new Date().toISOString(), // Fallback if null
        similarity: row.similarity, // Corrected from similarity_score
      })
    );

    console.log("transformedResultsData:", transformedResultsData);

    // Validate the transformed data using Zod
    // Note: We still return the original Supabase-derived type SearchProfilesByEmbeddingResult[]
    // but validate its structure matches our expectations.
    const validatedTransformedData = TransformedSearchResultsSchema.safeParse(
      transformedResultsData
    );

    console.log("validatedTransformedData:", validatedTransformedData);

    if (!validatedTransformedData.success) {
      console.error(
        "Zod validation error (transformed data):",
        validatedTransformedData.error.issues
      );
      // Decide how to handle this - maybe log and continue, or throw
      await writeEvent("error", {
        message: "Internal error during data transformation",
        details: validatedTransformedData.error.issues,
      });
      throw new Error("Internal error during data transformation");
    }

    // SCORE all results (using gpt)

    const scored_results = await score_results(
      validatedTransformedData.data,
      relevant_sections,
      traits
    );

    console.log("scored_results:", scored_results);

    // Use the validated transformed data for the final steps
    // Assert the type back to the Supabase-generated type after Zod validation
    const results: SearchProfilesByEmbeddingResult[] =
      scored_results as unknown as SearchProfilesByEmbeddingResult[];

    await writeEvent("step", {
      name: "search_execution",
      status: "completed",
      data: { count: results.length },
    });

    // Send final results with trait scores included
    await writeEvent(
      "results",
      scored_results.map((profile) => ({
        profile: {
          ...profile,
          // Remove trait_scores from the profile as it's not part of the original type
          trait_scores: undefined,
        },
        score: profile.similarity || 0,
        trait_scores: profile.trait_scores, // Add trait scores at the top level
        highlights: [],
      }))
    );

    // Signal completion
    await writeEvent("done", {});

    return results;
  } catch (error) {
    console.error("Error in advanced search:", error);
    if (writer) {
      await writer.write(
        new TextEncoder().encode(
          `event: error\ndata: ${JSON.stringify({
            message: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`
        )
      );
    }
    throw error;
  } finally {
    releaseSlot();
  }
}

async function get_relevant_sections(query: string): Promise<string[]> {
  const possible_sections = [
    "basic_info",
    "education",
    "experiences",
    "achievements",
    "projects",
    "location",
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${relevant_sections_prompt}\n\nAvailable sections: ${JSON.stringify(
          possible_sections
        )}`,
      },
      {
        role: "user",
        content: `Analyze this search query: "${query}"`,
      },
    ],
    temperature: 0.2,
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const parsedResponse = JSON.parse(content) as RelevantSectionsResponse;

    // Validate the response structure
    if (!Array.isArray(parsedResponse.relevant_sections)) {
      throw new Error(
        "Invalid response format: relevant_sections must be an array"
      );
    }

    // Ensure all sections are valid
    const invalidSections = parsedResponse.relevant_sections.filter(
      (section) => !possible_sections.includes(section)
    );

    if (invalidSections.length > 0) {
      throw new Error(`Invalid sections found: ${invalidSections.join(", ")}`);
    }

    return parsedResponse.relevant_sections;
  } catch (error) {
    console.error("Error parsing relevant sections:", error);
    // Fallback to all sections if parsing fails
    return possible_sections;
  }
}

async function get_traits(query: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: traits_prompt,
      },
      {
        role: "user",
        content: `Extract traits from this search query: "${query}"`,
      },
    ],
    temperature: 0.2,
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const parsedResponse = JSON.parse(content) as TraitsResponse;

    // Validate the response structure
    if (!Array.isArray(parsedResponse.traits)) {
      throw new Error("Invalid response format: traits must be an array");
    }

    // Validate each trait
    parsedResponse.traits.forEach((trait, index) => {
      if (!trait || typeof trait !== "string") {
        throw new Error(`Invalid trait at index ${index}`);
      }
    });

    return parsedResponse.traits;
  } catch (error) {
    console.error("Error parsing traits:", error);
    return []; // Return empty array if parsing fails
  }
}

async function get_key_phrases(
  traits: string[],
  relevant_sections: string[]
): Promise<KeyPhrase[]> {
  const possible_sections = relevant_sections;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${key_phrases_prompt}\n\nAvailable sections: ${JSON.stringify(
          possible_sections
        )}`,
      },
      {
        role: "user",
        content: `Generate key phrases for these traits: ${JSON.stringify(
          traits
        )}`,
      },
    ],
    temperature: 0.5,
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const parsedResponse = JSON.parse(content) as KeyPhrasesResponse;

    // Validate the response structure
    if (!Array.isArray(parsedResponse.key_phrases)) {
      throw new Error("Invalid response format: key_phrases must be an array");
    }

    // Validate each key phrase object
    parsedResponse.key_phrases.forEach((phrase, index) => {
      if (!phrase.key_phrase || !phrase.relevant_section) {
        throw new Error(
          `Invalid key phrase at index ${index}: missing required fields`
        );
      }
      if (!possible_sections.includes(phrase.relevant_section)) {
        throw new Error(
          `Invalid section "${phrase.relevant_section}" at index ${index}`
        );
      }
      if (phrase.confidence < 0 || phrase.confidence > 1) {
        throw new Error(`Invalid confidence value at index ${index}`);
      }
    });

    return parsedResponse.key_phrases;
  } catch (error) {
    console.error("Error parsing key phrases:", error);
    return []; // Return empty array if parsing fails
  }
}

async function generate_sql_query(
  filters: Filter[],
  traits: string[],
  key_phrases: KeyPhrase[]
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: query_prompt,
      },
      {
        role: "user",
        content: `Generate a SQL query using:
        - Traits: ${JSON.stringify(traits)}
        - Key Phrases: ${JSON.stringify(key_phrases)}
        - Filters: ${JSON.stringify(filters)}`,
      },
    ],
    temperature: 0.2,
  });

  console.log("complete prompt:" + response.choices[0].message.content);

  try {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const parsedResponse = JSON.parse(content) as SQLQueryResponse;

    // Validate the response
    if (!parsedResponse.query || typeof parsedResponse.query !== "string") {
      throw new Error("Invalid SQL query in response");
    }

    // Add basic validation to the generated query
    const query = parsedResponse.query.trim();
    if (!query.startsWith("SELECT")) {
      throw new Error("Query must start with SELECT");
    }

    // Ensure the query has a LIMIT clause
    const finalQuery = query.includes("LIMIT") ? query : `${query} LIMIT 100`;

    return finalQuery;
  } catch (error) {
    console.error("Error generating SQL query:", error);
    // Return a safe default query
    return "SELECT * FROM linkedin_profiles.profiles LIMIT 100";
  }
}

async function score_results(
  profiles: TransformedSearchResult[],
  relevant_sections: string[],
  traits: string[]
): Promise<ScoredSearchResults> {
  // Skip scoring if there are no traits or profiles
  if (traits.length === 0 || profiles.length === 0) {
    return profiles.map((profile) => ({
      ...profile,
      trait_scores: [],
    }));
  }

  try {
    // Extract relevant info from profiles for scoring
    const profilesForScoring = profiles.map((profile) => {
      // Create object with only relevant data
      const profileData: Record<string, any> = {
        id: profile.id,
      };

      // Always include basic info regardless of relevant sections
      profileData.basic_info = {
        id: profile.id,
        full_name: profile.full_name,
        headline: profile.headline || "",
        summary: profile.summary || "",
        location: profile.location || "",
        industry: profile.industry || "",
      };

      // Only include sections specified in relevant_sections
      if (relevant_sections.includes("experiences")) {
        profileData.experiences =
          profile.raw_profile_data?.experiences?.map((exp) => ({
            title: exp.title || "",
            company: exp.company || "",
            description: exp.description || "",
            location: exp.location || "",
            start_at: exp.start_at ? `${exp.start_at.year}` : "",
            ends_at: exp.ends_at ? `${exp.ends_at.year}` : "Present",
          })) || [];
      }

      if (relevant_sections.includes("education")) {
        profileData.education =
          profile.raw_profile_data?.education?.map((edu) => ({
            school: edu.school || "",
            degree: edu.degree_name || "",
            field: edu.field_of_study || "",
            starts_at: edu.starts_at ? `${edu.starts_at.year}` : "",
            ends_at: edu.ends_at ? `${edu.ends_at.year}` : "Present",
          })) || [];
      }

      if (
        relevant_sections.includes("projects") ||
        relevant_sections.includes("achievements")
      ) {
        profileData.projects =
          profile.raw_profile_data?.accomplishment_projects?.map((proj) => ({
            title: proj.title || "",
            description: proj.description || "",
          })) || [];
      }

      if (relevant_sections.includes("skills")) {
        profileData.skills = profile.raw_profile_data?.skills || [];
      }

      return profileData;
    });

    console.log("profilesForScoring:", profilesForScoring);

    // Create the prompt for GPT
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: score_results_prompt,
        },
        {
          role: "user",
          content: `Score ${
            profiles.length
          } LinkedIn profiles against these traits: ${JSON.stringify(traits)}
          and these relevant sections: ${JSON.stringify(relevant_sections)}
          Here are the profiles to evaluate:
          ${JSON.stringify(profilesForScoring)}
          
          Return only the scores and evidence for each trait against each profile.`,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in GPT response");
    }

    // Parse the response
    const parsedResponse = JSON.parse(content) as {
      scored_profiles: Array<{ id: string; trait_scores: TraitScore[] }>;
    };

    // Validate the response has the expected structure
    if (
      !parsedResponse.scored_profiles ||
      !Array.isArray(parsedResponse.scored_profiles)
    ) {
      throw new Error(
        "Invalid GPT response format: missing scored_profiles array"
      );
    }

    // Merge scores back with the original profiles
    const scoredResults: ScoredSearchResults = profiles.map((profile) => {
      const scoreData = parsedResponse.scored_profiles.find(
        (p) => p.id === profile.id
      );

      if (!scoreData) {
        // If scoring data not found for this profile, return with empty scores
        return {
          ...profile,
          trait_scores: traits.map((trait) => ({
            trait,
            score: "No" as const,
            evidence: "No scoring data available",
          })),
        };
      }

      return {
        ...profile,
        trait_scores: scoreData.trait_scores,
      };
    });

    // Validate with Zod to ensure expected output format
    const validatedScoredResults =
      ScoredSearchResultsSchema.safeParse(scoredResults);

    if (!validatedScoredResults.success) {
      console.error(
        "Zod validation error (scored results):",
        validatedScoredResults.error.issues
      );
      throw new Error("Invalid scored results format");
    }

    return validatedScoredResults.data;
  } catch (error) {
    console.error("Error in score_results:", error);
    // Fall back to returning profiles with empty scores
    return profiles.map((profile) => ({
      ...profile,
      trait_scores: traits.map((trait) => ({
        trait,
        score: "No" as const,
        evidence:
          "Scoring failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      })),
    }));
  }
}

// Replace the POST handler with a streaming version
export async function POST(request: Request) {
  const encoder = new TextEncoder();

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

    // Create a streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the search process (don't await - we want to start returning the stream)
    advanced_search(query, writer)
      .catch((error) => {
        console.error("Search error:", error);
        writer.write(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              message: "Failed to search profiles",
            })}\n\n`
          )
        );
        writer.close();
      })
      .finally(() => {
        writer.close();
      });

    // Return the stream as a response
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
