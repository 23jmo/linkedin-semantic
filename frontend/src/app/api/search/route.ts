import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { SearchQuerySchema, SearchResultsSchema, type SearchResult } from '@/types/types'
import { generateEmbedding } from '@/lib/server/embeddings'
import { SearchResultSchema } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {

  try {
    const body = await request.json()
    
    // Validate request
    const result = SearchQuerySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { query, match_limit, match_threshold } = result.data

    // Generate embedding for the search query
    const {data, error} = await semantic_search(query, match_limit, match_threshold)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    // Transform to match SearchResult type
    const results = data?.map((profile: SearchResult) => ({
      profile: profile.profile,
      score: profile.score,
      highlights: profile.highlights
    })) || []

    console.log("Search Results:", results)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in semantic search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function semantic_search(query: string, match_limit: number = 10, match_threshold: number = 0.5) {
  // Generate embedding for the search query
  const embedding = await generateEmbedding(query)
  
  // Ensure embedding is an array of numbers
  const embedding_list = embedding.map(x => Number(x))
  
  // Perform semantic search using Supabase's pgvector
  const { data: profiles, error } = await supabase.rpc('search_profiles_by_embedding', {
    query_embedding: embedding_list,
    match_threshold: Number(match_threshold),
    match_count: Number(match_limit),
  })
  
  if (error) {
    throw new Error(`Semantic search error: ${error.message}`)
  }
  
  return profiles
}