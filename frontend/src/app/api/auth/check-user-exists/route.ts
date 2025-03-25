import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { 
  CheckUserExistsRequestSchema, 
  CheckUserExistsResponseSchema,
  ErrorResponseSchema,
  type CheckUserExistsRequest,
  type CheckUserExistsResponse,
  type ErrorResponse 
} from './types'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema('next_auth')

const supabase_profiles = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema('linkedin_profiles')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body against schema
    const result = CheckUserExistsRequestSchema.safeParse(body)
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        error: result.error.issues[0].message
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const { user_id } = result.data

    // Check if user exists in database
    const { data: user_auth, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()
    
      const {data: user_profile, error: error_profile} = await supabase_profiles
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (error) {
      console.error('Error checking user:', error)
      const errorResponse: ErrorResponse = {
        error: 'Database error'
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Validate response against schema
    const response: CheckUserExistsResponse = {
      user_exists: !!user_auth && !!user_profile,
      linkedin_profile: user_auth || undefined
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in check-user-exists:', error)
    const errorResponse: ErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
