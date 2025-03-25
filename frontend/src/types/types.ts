import { z } from 'zod'


export const RawProfileDataSchema = z.object({
  // Basic info
  full_name: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  headline: z.string(),
  summary: z.string(),
  profile_pic_url: z.string(),
  background_cover_image_url: z.string(),
  public_identifier: z.string(),

  // Location info
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  country_full_name: z.string().nullable(),

  // Professional details
  industry: z.string().nullable(),
  occupation: z.string().nullable(),
  experiences: z.array(z.any()),
  education: z.array(z.any()),
  certifications: z.array(z.any()),
  skills: z.array(z.any()),

  // Network info
  connections: z.number(),
  follower_count: z.number(),
  people_also_viewed: z.array(z.any()),

  // Additional details
  languages: z.array(z.any()),
  interests: z.array(z.any()),
  volunteer_work: z.array(z.any()),
  groups: z.array(z.any()),
  
  // Accomplishments
  accomplishment_courses: z.array(z.any()),
  accomplishment_honors_awards: z.array(z.any()),
  accomplishment_patents: z.array(z.any()),
  accomplishment_projects: z.array(z.any()),
  accomplishment_publications: z.array(z.any()),
  accomplishment_organisations: z.array(z.any()),
  accomplishment_test_scores: z.array(z.any()),

  // Other fields
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
})

export const ProfileSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  linkedin_id: z.string().optional(),
  full_name: z.string(),
  headline: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  profile_url: z.string().optional(),
  profile_picture_url: z.string().optional(),
  summary: z.string().optional(),
  raw_profile_data: RawProfileDataSchema.optional(),
  created_at: z.string(),
  updated_at: z.string()
})

// Request Schema
export const CheckUserExistsRequestSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  linkedin_auth: z.object({}).optional()
})

// Response Schema
export const CheckUserExistsResponseSchema = z.object({
  user_exists: z.boolean(),
  linkedin_profile: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    email_verified: z.boolean().optional(),
    image: z.string().optional(),
  }).optional()
})

export const ProfileDeleteRequestSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
})

export const ProfileDeleteResponseSchema = z.object({
  success: z.boolean()
})

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string()
})
// Request Schema
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  match_limit: z.number().optional() || 10,
  match_threshold: z.number().optional() || 0.5
})

// Response Schema for a single profile
export const SearchResultSchema = z.object({
  profile: ProfileSchema,
  score: z.number(),
  highlights: z.array(z.string()).optional()
})

export const SearchResultsSchema = z.array(SearchResultSchema)

// Query Embedding Schema
export const QueryEmbeddingSchema = z.object({
  query: z.string(),
  embedding: z.array(z.number()),
  embedding_model: z.string()
})



// TypeScript types derived from schemas
export type CheckUserExistsRequest = z.infer<typeof CheckUserExistsRequestSchema>
export type CheckUserExistsResponse = z.infer<typeof CheckUserExistsResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema> 
export type QueryEmbedding = z.infer<typeof QueryEmbeddingSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type ProfileDeleteRequest = z.infer<typeof ProfileDeleteRequestSchema>
export type ProfileDeleteResponse = z.infer<typeof ProfileDeleteResponseSchema>
export type SearchQuery = z.infer<typeof SearchQuerySchema>
export type SearchResult = z.infer<typeof SearchResultSchema> 
export type SearchResults = z.infer<typeof SearchResultsSchema> 

