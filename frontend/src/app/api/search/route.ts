import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SearchQuerySchema } from "@/types/types";
import { generateEmbedding } from "@/lib/server/embeddings";
import { generateHydeChunks } from "@/lib/server/hyde";
import type { Database } from "@/types/linkedin-profile.types";
import { ProfileChunkType } from "@/types/profile-chunks";
import { RawProfileDataSchema } from "@/types/types";

import OpenAI from "openai";

import { RawProfile } from "@/types/types";
import { query_prompt } from "./query_prompt";
import { relevant_sections_prompt } from "./relevant_sections_prompt";
import { traits_prompt } from "./traits_prompt";
import { filters_prompt } from "./filters_prompt";
import { key_phrases_prompt } from "./key_phrases_prompt";

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

interface FilterResponse {
  filters: Filter[];
  reasoning: string;
}

interface SQLResult {
  id: string;
  raw_profile_data: any;
  similarity?: number;
}

interface RankedResult {
  id: string;
  raw_profile_data: any;
  similarity_score: number;
  match_details: {
    phrase: string;
    similarity: number;
  }[];
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

async function advanced_search(
  query: string
): Promise<SearchProfilesByEmbeddingResult[]> {
  await waitForSlot();

  try {
    // Get relevant sections
    const relevant_sections = await get_relevant_sections(query);
    console.log("Relevant sections:", relevant_sections);

    // Get traits
    const traits = await get_traits(query);
    console.log("Traits:", traits);

    // Get key phrases
    const key_phrases = await get_key_phrases(traits, relevant_sections);
    console.log("Key phrases:", key_phrases);

    // Generate SQL query for initial filtering

    //     const test_query = `
    //     SELECT * FROM linkedin_profiles.profiles
    // WHERE (
    //   raw_profile_data->'education' @> '[{"school": "Columbia University"}]' OR
    //   raw_profile_data->'education' @> '[{"degree": "Bachelor''s degree from Columbia"}]'
    // )
    // LIMIT 100`;

    const sql_query = await generate_sql_query([], traits, key_phrases);
    console.log("Generated SQL:", sql_query);

    // Execute combined search and ranking with timeout
    // const result = await supabase.rpc("run_dynamic_query", {
    //   query_text: sql_query.trim(),
    // });

    const result = await supabase.rpc("search_and_rank", {
      query_text: sql_query.trim(),
      key_phrases: key_phrases,
    });

    if (result.error) {
      console.error("Search error:", result.error);
      throw new Error(`Search failed: ${result.error.message}`);
    }

    // Validate and transform results
    if (!Array.isArray(result.data)) {
      throw new Error("Invalid response format");
    }

    // Transform results to match SearchProfilesByEmbeddingResult type
    const results: SearchProfilesByEmbeddingResult[] = result.data.map(
      (row: any) => ({
        id: row.id,
        user_id: row.raw_profile_data?.user_id || "",
        linkedin_id: row.raw_profile_data?.linkedin_id || "",
        full_name: row.raw_profile_data?.full_name || "",
        headline: row.raw_profile_data?.headline || "",
        industry: row.raw_profile_data?.industry || "",
        location: row.raw_profile_data?.location || "",
        profile_url: row.raw_profile_data?.profile_url || "",
        profile_picture_url: row.raw_profile_data?.profile_picture_url || "",
        summary: row.raw_profile_data?.summary || "",
        raw_profile_data: row.raw_profile_data,
        created_at:
          row.raw_profile_data?.created_at || new Date().toISOString(),
        updated_at:
          row.raw_profile_data?.updated_at || new Date().toISOString(),
        similarity: row.similarity_score,
      })
    );

    return results;
  } catch (error) {
    console.error("Error in advanced search:", error);
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

async function get_filters(query: string): Promise<Filter[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: filters_prompt,
      },
      {
        role: "user",
        content: `Extract filters from this search query: "${query}"`,
      },
    ],
    temperature: 0.2,
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const parsedResponse = JSON.parse(content) as FilterResponse;

    // Validate the response structure
    if (!Array.isArray(parsedResponse.filters)) {
      throw new Error("Invalid response format: filters must be an array");
    }

    // Validate each filter
    parsedResponse.filters.forEach((filter, index) => {
      if (!filter.field || !filter.value || !filter.operator) {
        throw new Error(
          `Invalid filter at index ${index}: missing required fields`
        );
      }
      if (!["=", "ILIKE", "@>"].includes(filter.operator)) {
        throw new Error(
          `Invalid operator "${filter.operator}" at index ${index}`
        );
      }
    });

    return parsedResponse.filters;
  } catch (error) {
    console.error("Error parsing filters:", error);
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

async function semantic_search(
  query: string,
  match_limit: number = 10,
  match_threshold: number = 0.5,
  useHyde: boolean = true
) {
  try {
    // Get results from advanced_search
    const results = await advanced_search(query);

    // Return the results with the same structure as before
    return {
      data: results.map((profile) => ({
        profile,
        score: profile.similarity || 0,
        highlights: [],
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error in semantic search:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
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
