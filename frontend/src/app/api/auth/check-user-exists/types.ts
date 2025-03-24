import { z } from 'zod'

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

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string()
})

// TypeScript types derived from schemas
export type CheckUserExistsRequest = z.infer<typeof CheckUserExistsRequestSchema>
export type CheckUserExistsResponse = z.infer<typeof CheckUserExistsResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema> 