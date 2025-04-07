export type ProfileChunkType =
  | "basic_info" // name, headline, location
  | "summary" // profile summary
  | "experience" // work experience
  | "skills" // skills and endorsements
  | "education" // education history
  | "achievements"; // certifications, awards, etc

export interface ProfileChunk {
  profile_id: string;
  chunk_type: ProfileChunkType;
  content: string;
  embedding: number[];
}

// For HyDE generation
export interface ChunkTemplate {
  chunk_type: ProfileChunkType;
  fields: string[];
  prompt: string;
}
