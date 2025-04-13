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
    start_at_day INTEGER,
    start_at_month INTEGER,
    start_at_year INTEGER,
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

-- Migrate data from raw_profile_data to new tables
DO $$
DECLARE
    profile_record RECORD;
    education_record JSONB;
    experience_record JSONB;
    certification_record JSONB;
    course_record JSONB;
    project_record JSONB;
    skill_record TEXT;
BEGIN
    -- Loop through all profiles
    FOR profile_record IN SELECT id, raw_profile_data FROM linkedin_profiles.profiles
    LOOP
        -- Migrate education data
        IF profile_record.raw_profile_data->'education' IS NOT NULL THEN
            FOR education_record IN SELECT * FROM jsonb_array_elements(profile_record.raw_profile_data->'education')
            LOOP
                INSERT INTO linkedin_profiles.education (
                    profile_id,
                    activities_and_societies,
                    school,
                    grade,
                    degree_name,
                    field_of_study,
                    description,
                    starts_at_day,
                    starts_at_month,
                    starts_at_year,
                    ends_at_day,
                    ends_at_month,
                    ends_at_year,
                    logo_url,
                    school_linkedin_profile_url
                ) VALUES (
                    profile_record.id,
                    education_record->>'activities_and_societies',
                    education_record->>'school',
                    education_record->>'grade',
                    education_record->>'degree_name',
                    education_record->>'field_of_study',
                    education_record->>'description',
                    (education_record->'starts_at'->>'day')::INTEGER,
                    (education_record->'starts_at'->>'month')::INTEGER,
                    (education_record->'starts_at'->>'year')::INTEGER,
                    (education_record->'ends_at'->>'day')::INTEGER,
                    (education_record->'ends_at'->>'month')::INTEGER,
                    (education_record->'ends_at'->>'year')::INTEGER,
                    education_record->>'logo_url',
                    education_record->>'school_linkedin_profile_url'
                );
            END LOOP;
        END IF;

        -- Migrate experience data
        IF profile_record.raw_profile_data->'experiences' IS NOT NULL THEN
            FOR experience_record IN SELECT * FROM jsonb_array_elements(profile_record.raw_profile_data->'experiences')
            LOOP
                INSERT INTO linkedin_profiles.experience (
                    profile_id,
                    title,
                    company,
                    description,
                    start_at_day,
                    start_at_month,
                    start_at_year,
                    ends_at_day,
                    ends_at_month,
                    ends_at_year,
                    logo_url,
                    location,
                    company_facebook_profile_url,
                    company_linkedin_profile_url
                ) VALUES (
                    profile_record.id,
                    experience_record->>'title',
                    experience_record->>'company',
                    experience_record->>'description',
                    (experience_record->'start_at'->>'day')::INTEGER,
                    (experience_record->'start_at'->>'month')::INTEGER,
                    (experience_record->'start_at'->>'year')::INTEGER,
                    (experience_record->'ends_at'->>'day')::INTEGER,
                    (experience_record->'ends_at'->>'month')::INTEGER,
                    (experience_record->'ends_at'->>'year')::INTEGER,
                    experience_record->>'logo_url',
                    experience_record->>'location',
                    experience_record->>'company_facebook_profile_url',
                    experience_record->>'company_linkedin_profile_url'
                );
            END LOOP;
        END IF;

        -- Migrate certifications data
        IF profile_record.raw_profile_data->'certifications' IS NOT NULL THEN
            FOR certification_record IN SELECT * FROM jsonb_array_elements(profile_record.raw_profile_data->'certifications')
            LOOP
                INSERT INTO linkedin_profiles.certifications (
                    profile_id,
                    name
                ) VALUES (
                    profile_record.id,
                    certification_record->>'name'
                );
            END LOOP;
        END IF;

        -- Migrate courses data
        IF profile_record.raw_profile_data->'accomplishment_courses' IS NOT NULL THEN
            FOR course_record IN SELECT * FROM jsonb_array_elements(profile_record.raw_profile_data->'accomplishment_courses')
            LOOP
                INSERT INTO linkedin_profiles.courses (
                    profile_id,
                    name,
                    number
                ) VALUES (
                    profile_record.id,
                    course_record->>'name',
                    course_record->>'number'
                );
            END LOOP;
        END IF;

        -- Migrate projects data
        IF profile_record.raw_profile_data->'accomplishment_projects' IS NOT NULL THEN
            FOR project_record IN SELECT * FROM jsonb_array_elements(profile_record.raw_profile_data->'accomplishment_projects')
            LOOP
                INSERT INTO linkedin_profiles.projects (
                    profile_id,
                    title,
                    description,
                    url,
                    starts_at_day,
                    starts_at_month,
                    starts_at_year,
                    ends_at_day,
                    ends_at_month,
                    ends_at_year
                ) VALUES (
                    profile_record.id,
                    project_record->>'title',
                    project_record->>'description',
                    project_record->>'url',
                    (project_record->'starts_at'->>'day')::INTEGER,
                    (project_record->'starts_at'->>'month')::INTEGER,
                    (project_record->'starts_at'->>'year')::INTEGER,
                    (project_record->'ends_at'->>'day')::INTEGER,
                    (project_record->'ends_at'->>'month')::INTEGER,
                    (project_record->'ends_at'->>'year')::INTEGER
                );
            END LOOP;
        END IF;

        -- Migrate skills data
        IF profile_record.raw_profile_data->'skills' IS NOT NULL THEN
            FOR skill_record IN SELECT * FROM jsonb_array_elements_text(profile_record.raw_profile_data->'skills')
            LOOP
                INSERT INTO linkedin_profiles.skills (
                    profile_id,
                    skill
                ) VALUES (
                    profile_record.id,
                    skill_record
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Add indexes for better query performance
CREATE INDEX idx_education_profile_id ON linkedin_profiles.education(profile_id);
CREATE INDEX idx_experience_profile_id ON linkedin_profiles.experience(profile_id);
CREATE INDEX idx_certifications_profile_id ON linkedin_profiles.certifications(profile_id);
CREATE INDEX idx_courses_profile_id ON linkedin_profiles.courses(profile_id);
CREATE INDEX idx_projects_profile_id ON linkedin_profiles.projects(profile_id);
CREATE INDEX idx_skills_profile_id ON linkedin_profiles.skills(profile_id);
