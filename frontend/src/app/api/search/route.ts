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
// Define the filter type
interface Filter {
  field: string;
  value: string;
  operator: "=" | "ILIKE" | "@>";
}

// Import the JSON template
const jsonTemplate = JSON.stringify(RawProfileDataSchema);

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

    const test_query = `
    SELECT * FROM linkedin_profiles.profiles 
WHERE (
  raw_profile_data->'education' @> '[{"school": "Columbia University"}]' OR
  raw_profile_data->'education' @> '[{"degree": "Bachelor''s degree from Columbia"}]'
)
LIMIT 100`;

    const sql_query = await generate_sql_query([], traits, key_phrases);
    console.log("Generated SQL:", sql_query);

    // Execute combined search and ranking with timeout
    // const result = await supabase.rpc("run_dynamic_query", {
    //   query_text: sql_query.trim(),
    // });

    const result = await supabase.rpc("search_and_rank", {
      query_text: test_query.trim(),
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
    "experience",
    "achievements",
    "location",
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a search query analyzer. Analyze the search query and return a JSON object with:
        - relevant_sections: Array of relevant section names from the provided list
        - confidence: Number between 0-1 indicating confidence in the selection
        - reasoning: Brief explanation of why these sections were chosen
        
        Available sections: ${JSON.stringify(possible_sections)}`,
      },
      {
        role: "user",
        content: `Analyze this search query: "${query}"`,
      },
    ],
    temperature: 0.2, // Lower temperature for more consistent results
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
        content: `You are a search query analyzer. Extract relevant traits from the search query that would help identify LinkedIn profiles.
        Return a JSON object with:
        - traits: Array of strings, each representing a distinct trait
        - reasoning: Brief explanation of why these traits were chosen
        
        Focus on extracting:
        - Educational background (e.g., "Graduated from Columbia University")
        - Work experience (e.g., "Works at Google")
        - Skills or expertise
        - Notable achievements
        - Location preferences
        
        Each trait should be a complete phrase that could appear in a LinkedIn profile.`,
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
        content: `You are a search query analyzer. Extract exact filters from the search query that would help identify LinkedIn profiles.
        
        Return a JSON object with:
        - filters: Array of filter objects, each containing:
          * field: The JSONB path in raw_profile_data (e.g., 'full_name', 'education.school', 'experiences.company')
          * value: The exact value to match
          * operator: The operator to use ('=' for exact match, 'ILIKE' for text search, '@>' for array containment)
        - reasoning: Brief explanation of why these filters were chosen
        
        Focus on extracting:
        - Exact company names
        - Exact school names
        - Exact locations (city, state, country)
        - Exact job titles
        - Exact skill names
        
        Example response:
        {
          "filters": [
            {
              "field": "experiences.company",
              "value": "Google",
              "operator": "="
            },
            {
              "field": "education.school",
              "value": "Columbia University",
              "operator": "="
            }
          ],
          "reasoning": "Extracted exact company and school names for precise matching"
        }`,
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
        content: `You are a search query analyzer. For each trait, generate key phrases that relevant profiles might have in their ${JSON.stringify(
          possible_sections
        )} section(s).

        Can be somewhat creative with it. 

        Return a JSON object with:
        - key_phrases: Array of objects, each containing:
          * key_phrase: The searchable phrase
          * relevant_section: Which section this phrase applies to (must be one of: ${JSON.stringify(
            possible_sections
          )})
          * confidence: Number between 0-1 indicating confidence in this mapping
        - reasoning: Brief explanation of why these key phrases were chosen
        
        Focus on generating phrases that would be commonly found in LinkedIn profiles.`,
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
        content: `You are a SQL query generator for LinkedIn profile search. Generate a SQL query that searches through the raw_profile_data JSONB column.
        
        The profile data structure follows this schema:
        ${jsonTemplate}
        
        Return a JSON object with:
        - query: The SQL query string
        - reasoning: Brief explanation of the query structure
        
        Rules:
        1. Use JSONB operators to search within the raw_profile_data
        2. For text searches, use ILIKE for case-insensitive matching
        3. For exact matches, use = 
        4. For array fields, use @> operator
        5. Combine conditions with AND/OR as appropriate
        6. Use proper JSONB path syntax (->, ->>, #>>)
        7. Include relevant sections from the key phrases
        8. Handle nested arrays properly (e.g., education, experiences)
        9. Use proper type casting for numeric fields
        10. ALWAYS use the table name 'linkedin_profiles.profiles'
        11. ALWAYS double escape single quotes in text values (e.g., 'O''Reilly' instead of 'O'Reilly')
        12. DO NOT have a semicolon at the end of the query
        
        Example query structure:
        SELECT * FROM linkedin_profiles.profiles 
WHERE (
  raw_profile_data->'education' @> '[{"school": "Columbia University"}]' OR
  raw_profile_data->'education' @> '[{"degree": "Bachelor''s degree from Columbia"}]'
)
LIMIT 100
`,
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
  const result = await advanced_search(query);
  console.log("Result:", result);

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
  const profileScores = new Map<string, ProfileScoreInfo>();

  // Extract keywords once before the loop
  const queryKeywords = query
    .toLowerCase()
    .split(/\\s+/)
    .filter((kw) => kw.length > 0); // Filter out empty strings

  chunkResults.forEach(({ chunk_type, profiles }) => {
    profiles.forEach((profile: SearchProfilesByEmbeddingResult) => {
      // Explicitly type current based on the map value type
      const current: ProfileScoreInfo = profileScores.get(profile.id) || {
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
        // Validate and parse raw_profile_data
        const parseResult = RawProfileDataSchema.safeParse(
          profile.raw_profile_data
        );
        const rawData = parseResult.success ? parseResult.data : null;

        switch (chunk_type) {
          case "basic_info":
            profileText = `${profile.full_name || ""} ${
              profile.headline || ""
            } ${profile.location || ""}`; // Combine relevant basic info fields
            break;
          case "summary":
            profileText = profile.summary || ""; // Assuming summary text is available
            break;
          case "experience":
            // Safely access experiences from parsed data
            profileText = JSON.stringify(rawData?.experiences || "");
            break;
          case "education":
            // Safely access education from parsed data
            profileText = JSON.stringify(rawData?.education || "");
            break;
          case "achievements":
            // Combine relevant accomplishment fields from parsed data
            const achievementsData = rawData
              ? {
                  courses: rawData.accomplishment_courses,
                  awards: rawData.accomplishment_honors_awards,
                  projects: rawData.accomplishment_projects,
                  publications: rawData.accomplishment_publications,
                  organizations: rawData.accomplishment_organisations,
                  test_scores: rawData.accomplishment_test_scores,
                }
              : {};
            profileText = JSON.stringify(achievementsData);
            break;
          default:
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
    .map(({ profile, totalScore }) => ({
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
