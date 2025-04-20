CREATE OR REPLACE FUNCTION linkedin_profiles.search_and_rank(
  query_text TEXT,
  key_phrases JSONB
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  linkedin_id TEXT,
  full_name TEXT,
  headline TEXT,
  industry TEXT,
  location TEXT,
  profile_url TEXT,
  profile_picture_url TEXT,
  summary TEXT,
  raw_profile_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_profile_id UUID;
  section_type profile_chunk_type;
  key_phrase TEXT;
  key_phrase_embedding vector(1536);
  similarity_score FLOAT;
  match_details JSONB := '[]'::JSONB;
BEGIN
  -- Sanity check to only allow SELECT queries
  IF lower(left(trim(query_text), 6)) <> 'select' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  -- Create a temp table using dynamic SQL with ON COMMIT DROP
  EXECUTE format($sql$
    CREATE TEMP TABLE temp_results ON COMMIT DROP AS
    WITH base_query AS (%s)
    SELECT 
      p.id,
      p.user_id,
      p.linkedin_id,
      p.full_name,
      p.headline,
      p.industry,
      p.location,
      p.profile_url,
      p.profile_picture_url,
      p.summary,
      p.raw_profile_data,
      p.created_at,
      p.updated_at,
      json_agg(DISTINCT ed.*) AS education,
      json_agg(DISTINCT exp.*) AS experiences,
      json_agg(DISTINCT s.skill) AS skills,
      json_agg(DISTINCT c.name) AS certifications,
      json_agg(DISTINCT pr.*) AS projects
    FROM base_query p
    LEFT JOIN linkedin_profiles.education ed ON ed.profile_id = p.id
    LEFT JOIN linkedin_profiles.experience exp ON exp.profile_id = p.id
    LEFT JOIN linkedin_profiles.skills s ON s.profile_id = p.id
    LEFT JOIN linkedin_profiles.certifications c ON c.profile_id = p.id
    LEFT JOIN linkedin_profiles.projects pr ON pr.profile_id = p.id
    GROUP BY p.id, p.user_id, p.linkedin_id, p.full_name, p.headline, 
             p.industry, p.location, p.profile_url, p.profile_picture_url, p.summary,
             p.raw_profile_data, p.created_at, p.updated_at
  $sql$, query_text);

  -- Loop through each profile
  FOR current_profile_id IN SELECT temp_results.id FROM temp_results LOOP
    match_details := '[]'::JSONB;

    -- For each key phrase
    FOR key_phrase IN SELECT jsonb_array_elements_text(key_phrases) LOOP
      -- Cache the key_phrase embedding
      SELECT embedding
      INTO key_phrase_embedding
      FROM linkedin_profiles.profile_chunks
      WHERE content = key_phrase
      LIMIT 1;

      IF key_phrase_embedding IS NULL THEN
        CONTINUE; -- Skip if we couldn't find the embedding
      END IF;

      -- Find best-matching section for the current profile
      SELECT 
        pc.section_type,
        (1 - (pc.embedding <=> key_phrase_embedding)) / 2 + 0.5
      INTO section_type, similarity_score
      FROM linkedin_profiles.profile_chunks pc
      WHERE pc.profile_id = current_profile_id
      ORDER BY pc.embedding <=> key_phrase_embedding
      LIMIT 1;

      IF similarity_score > 0.5 THEN
        match_details := match_details || jsonb_build_object(
          'phrase', key_phrase,
          'section', section_type,
          'similarity', similarity_score
        );
      END IF;
    END LOOP;

    -- Return the row with aggregated similarity
    RETURN QUERY
    SELECT 
      t.id,
      t.user_id,
      t.linkedin_id,
      t.full_name,
      t.headline,
      t.industry,
      t.location,
      t.profile_url,
      t.profile_picture_url,
      t.summary,
      t.raw_profile_data,
      t.created_at,
      t.updated_at,
      COALESCE((
        SELECT AVG((m->>'similarity')::FLOAT)
        FROM jsonb_array_elements(match_details) m
      ), 0.0) AS similarity
    FROM temp_results t
    WHERE t.id = current_profile_id;
  END LOOP;

  RETURN;
END;
$$;