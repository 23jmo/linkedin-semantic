import { z } from 'zod'

// Request Schema
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().optional() || 10,
  offset: z.number().optional() || 0
})

// Response Schema for a single profile
export const SearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  headline: z.string().optional(),
  profile_url: z.string().optional(),
  similarity_score: z.number().optional()
})

// Query Embedding Schema
export const QueryEmbeddingSchema = z.object({
  query: z.string(),
  embedding: z.array(z.number()),
  embedding_model: z.string()
})

// TypeScript type for QueryEmbedding
export type QueryEmbedding = z.infer<typeof QueryEmbeddingSchema>


// Array of search results
export const SearchResultsSchema = z.array(SearchResultSchema)

// TypeScript types
export type SearchQuery = z.infer<typeof SearchQuerySchema>
export type SearchResult = z.infer<typeof SearchResultSchema> 

