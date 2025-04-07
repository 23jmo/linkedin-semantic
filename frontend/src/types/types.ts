import { z } from "zod";

export const ExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  description: z.string().nullable().optional(),
  start_at: z.object({
    day: z.number(),
    month: z.number(),
    year: z.number(),
  }),
  ends_at: z
    .object({
      day: z.number(),
      month: z.number(),
      year: z.number(),
    })
    .nullable()
    .optional(),
  logo_url: z.string().optional().nullable(),
  location: z.string().nullable().optional(),
  company_facebook_profile_url: z.string().optional().nullable(),
  company_linkedin_profile_url: z.string().optional().nullable(),
});

export const EducationSchema = z.object({
  activities_and_societies: z.string().optional().nullable(),
  school: z.string(),
  grade: z.string().nullable().optional(),
  degree_name: z.string().optional(),
  field_of_study: z.string().optional(),
  description: z.string().nullable().optional(),
  starts_at: z.object({
    day: z.number(),
    month: z.number(),
    year: z.number(),
  }),
  ends_at: z
    .object({
      day: z.number(),
      month: z.number(),
      year: z.number(),
    })
    .nullable()
    .optional(),
  logo_url: z.string().optional().nullable(),
  school_linkedin_profile_url: z.string().optional().nullable(),
});

// Define Certification Schema
export const CertificationSchema = z.object({
  name: z.string().nullable(),
  // Add other fields if needed based on actual data, e.g., authority, url
});

// Define Course Schema
export const CourseSchema = z.object({
  name: z.string().nullable(),
  number: z.string().nullable().optional(),
});

// Define Project Schema
export const ProjectSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  starts_at: z
    .object({
      day: z.number().optional(),
      month: z.number().optional(),
      year: z.number(),
    })
    .optional(),
  ends_at: z
    .object({
      day: z.number().optional(),
      month: z.number().optional(),
      year: z.number(),
    })
    .optional(),
});

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
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  country_full_name: z.string().nullable().optional(),

  // Professional details
  industry: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  experiences: z.array(ExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
  skills: z.array(z.string()).optional(),

  // Network info
  connections: z.number().nullable().optional(),
  follower_count: z.number().nullable().optional(),
  people_also_viewed: z.array(z.any()).optional(),

  // Additional details
  languages: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  volunteer_work: z.array(z.any()).optional(),
  groups: z.array(z.any()).optional(),

  // Accomplishments
  accomplishment_courses: z.array(CourseSchema).optional(),
  accomplishment_honors_awards: z.array(z.any()).optional(),
  accomplishment_patents: z.array(z.any()).optional(),
  accomplishment_projects: z.array(ProjectSchema).optional(),
  accomplishment_publications: z.array(z.any()).optional(),
  accomplishment_organisations: z.array(z.any()).optional(),
  accomplishment_test_scores: z.array(z.any()).optional(),

  // Other fields
  articles: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  recommendations: z.array(z.any()).optional(),
  similarly_named_profiles: z.array(z.any()).optional(),
  personal_emails: z.array(z.string()).optional(),
  personal_numbers: z.array(z.string()).optional(),
  inferred_salary: z.number().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  extra: z.any().nullable().optional(),
});

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
  updated_at: z.string(),
});

// Request Schema
export const CheckUserExistsRequestSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  linkedin_auth: z.object({}).optional(),
});

// Response Schema
export const CheckUserExistsResponseSchema = z.object({
  user_exists: z.boolean(),
  linkedin_profile: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      email_verified: z.boolean().optional(),
      image: z.string().optional(),
    })
    .optional(),
});

export const GetLinkedInProfileRequestSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
});

export const GetLinkedInProfileResponseSchema = z.object({
  linkedin_profile: ProfileSchema,
});

export const ProfileDeleteRequestSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
});

export const ProfileDeleteResponseSchema = z.object({
  success: z.boolean(),
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
});
// Request Schema
export const SearchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required"),
  match_limit: z.number().optional().default(10),
  match_threshold: z.number().optional().default(0.5),
  useHyde: z.boolean().optional().default(true),
});

// Response Schema for a single profile
export const SearchResultSchema = z.object({
  profile: ProfileSchema,
  score: z.number(),
  highlights: z.array(z.string()).optional(),
});

export const SearchResultsSchema = z.array(SearchResultSchema);

// Query Embedding Schema
export const QueryEmbeddingSchema = z.object({
  query: z.string(),
  embedding: z.array(z.number()),
  embedding_model: z.string(),
});

export const AuthDataSchema = z.object({
  email: z.string(),
  name: z.string(),
  image: z.string().optional(),
});

export const ProfileCreateRequestSchema = z.object({
  user_id: z.string(),
  linkedin_auth: AuthDataSchema.optional(),
  linkedin_url: z.string(),
});

export const ProfileCreateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const ProfileDataSchema = z.object({
  id: z.string(),
  linkedin_id: z.string(),
  full_name: z.string(),
  email: z.string().optional(),
});

export const ProfileFrontendSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  profileUrl: z.string().optional(),
  profilePicture: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  raw_profile_data: RawProfileDataSchema.optional(),
});

export const EmailGenerationQuotaSchema = z.object({
  user_id: z.string(),
  emails_generated_this_month: z.number(),
  monthly_limit: z.number(),
  last_reset_date: z.string(),
  updated_at: z.string(),
  created_at: z.string(),
});

export const EmailGenerationQuotaRequestSchema = z.object({
  user_id: z.string(),
});

// TypeScript types derived from schemas
export type CheckUserExistsRequest = z.infer<
  typeof CheckUserExistsRequestSchema
>;
export type CheckUserExistsResponse = z.infer<
  typeof CheckUserExistsResponseSchema
>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type QueryEmbedding = z.infer<typeof QueryEmbeddingSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileDeleteRequest = z.infer<typeof ProfileDeleteRequestSchema>;
export type ProfileDeleteResponse = z.infer<typeof ProfileDeleteResponseSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResults = z.infer<typeof SearchResultsSchema>;
export type AuthData = z.infer<typeof AuthDataSchema>;
export type ProfileData = z.infer<typeof ProfileDataSchema>;
export type RawProfile = z.infer<typeof RawProfileDataSchema>;
export type ProfileFrontend = z.infer<typeof ProfileFrontendSchema>;
export type GetLinkedInProfileRequest = z.infer<
  typeof GetLinkedInProfileRequestSchema
>;
export type GetLinkedInProfileResponse = z.infer<
  typeof GetLinkedInProfileResponseSchema
>;
export type EmailGenerationQuota = z.infer<typeof EmailGenerationQuotaSchema>;

// Export new types
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Project = z.infer<typeof ProjectSchema>;
