export type RawProfile = {
  // Basic info
  full_name: string;
  first_name: string;
  last_name: string;
  headline: string;
  summary: string;
  profile_pic_url: string;
  background_cover_image_url: string;
  public_identifier: string;

  // Location info
  city: string | null;
  state: string | null; 
  country: string | null;
  country_full_name: string | null;

  // Professional details
  industry: string | null;
  occupation: string | null;
  experiences: any[]; // Could be typed more specifically if needed
  education: any[];
  certifications: any[];
  skills: any[];

  // Network info
  connections: number;
  follower_count: number;
  people_also_viewed: any[];

  // Additional details
  languages: any[];
  interests: any[];
  volunteer_work: any[];
  groups: any[];
  
  // Accomplishments
  accomplishment_courses: any[];
  accomplishment_honors_awards: any[];
  accomplishment_patents: any[];
  accomplishment_projects: any[];
  accomplishment_publications: any[];
  accomplishment_organisations: any[];
  accomplishment_test_scores: any[];

  // Other fields
  articles: any[];
  activities: any[];
  recommendations: any[];
  similarly_named_profiles: any[];
  personal_emails: string[];
  personal_numbers: string[];
  inferred_salary: number | null;
  birth_date: string | null;
  gender: string | null;
  extra: any | null;
}
