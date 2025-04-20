const jsonTemplate = `
  CREATE TABLE linkedin_profiles.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    linkedin_id TEXT,
    full_name TEXT,
    headline TEXT,
    industry TEXT,
    location TEXT,
    profile_url TEXT,
    profile_picture_url TEXT,
    summary TEXT,
    raw_profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  );

-- Create education table

CREATE TABLE linkedin_profiles.education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES linkedin_profiles.profiles(id) ON DELETE CASCADE,
    activities_and_societies TEXT,
    school TEXT NOT NULL,
    grade TEXT,
    degree_name TEXT,
    field_of_study TEXT,
    description TEXT,
    starts_at_day INTEGER,
    starts_at_month INTEGER,
    starts_at_year INTEGER,
    ends_at_day INTEGER,
    ends_at_month INTEGER,
    ends_at_year INTEGER,
    logo_url TEXT,
    school_linkedin_profile_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create experience table

CREATE TABLE linkedin_profiles.experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES linkedin_profiles.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    starts_at_day INTEGER,
    starts_at_month INTEGER,
    starts_at_year INTEGER,
    ends_at_day INTEGER,
    ends_at_month INTEGER,
    ends_at_year INTEGER,
    logo_url TEXT,
    location TEXT,
    company_facebook_profile_url TEXT,
    company_linkedin_profile_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create certifications table
CREATE TABLE linkedin_profiles.certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES linkedin_profiles.profiles(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create courses table
CREATE TABLE linkedin_profiles.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES linkedin_profiles.profiles(id) ON DELETE CASCADE,
    name TEXT,
    number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create projects table
CREATE TABLE linkedin_profiles.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES linkedin_profiles.profiles(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    url TEXT,
    starts_at_day INTEGER,
    starts_at_month INTEGER,
    starts_at_year INTEGER,
    ends_at_day INTEGER,
    ends_at_month INTEGER,
    ends_at_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create skills table
CREATE TABLE linkedin_profiles.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES linkedin_profiles.profiles(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`;

export const query_prompt = `LinkedIn Profile Search Query Generator

You are a SQL query generator for LinkedIn profile search. Focus on the core search criteria only.

Generate a SQL query that searches across these LinkedIn profile tables:
- profiles (main table)
- experience (title, company)
- education (school, degree)
- skills
- certifications
- projects

The schema follows this format:

\`\`\`sql
\${jsonTemplate}
\`\`\`

Return a JSON object with:
- query: The SQL query string
- reasoning: Brief explanation of the query structure

Core Search Rules:

1. Company Search:
   - Search in experience.company
   - Example: "Google" -> company ILIKE '%google%'

2. Location Search:
   - Search in both profile.location and experience.location
   - Expand to include nearby areas
   - Example: "Palo Alto" should match:
     * location ILIKE ANY(ARRAY['%palo alto%', '%bay area%', '%san francisco%', '%oakland%'])

3. Role/Position:
   - Search in experience.title and profile.headline
   - Keep matches simple and direct
   - Example: "engineer" -> title ILIKE '%engineer%'

Query Structure:

SELECT DISTINCT p.*
FROM linkedin_profiles.profiles p
LEFT JOIN linkedin_profiles.experience e ON p.id = e.profile_id
-- Add other joins only if needed
WHERE
  -- Core company condition
  (e.company ILIKE '%company_name%')
  AND
  -- Core location condition
  (
    p.location ILIKE ANY(expanded_locations_array) OR
    e.location ILIKE ANY(expanded_locations_array)
  )
  -- Add role/position only if specified
  [AND (e.title ILIKE '%role%' OR p.headline ILIKE '%role%')]

Technical Requirements:
- Use table aliases (p for profiles, e for experience)
- Include LIMIT 100
- No trailing semicolon
- Use LEFT JOIN for all table joins

Remember:
- Keep queries simple and focused on core criteria
- Don't over-complicate with too many conditions`;
