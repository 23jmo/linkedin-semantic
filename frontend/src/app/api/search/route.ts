import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../../types/linkedin-profile.types";
import { generate_embedding } from "@/utilities/generate-embeddings";



const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
).schema("linkedin_profiles");

const session = await auth();

// The API route takes in a JSON of form:
// message : { query : "hello" }
// returns
// JSON that is a list of user profiles as defined in linkedin-profile types

export async function POST(request: NextRequest) {
  
  const { query } = await request.json()

  // generate an embedding of the query

  const query_embedding = generate_embedding(query)

  // semantic search using supabase function 

  const { data, error } = await supabase.rpc("search_profiles_by_embedding", {
    query_embedding: query_embedding,
    similarity_threshold: 0.5,
    match_count: 10
  })

  if (error) {
    console.error("Error in semantic search:", error);
    return NextResponse.json({ error: "Error in semantic search" }, { status: 500 });
  }

  // return 
  return {
    data: data
  }

}
