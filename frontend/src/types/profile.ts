export interface Profile {
  id: string;
  user_id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  profileUrl: string;
  profilePicture?: string;
  highlights?: string[];
  raw_profile_data?: {
    experiences?: Array<{
      company?: string;
      title?: string;
      description?: string;
      logo_url?: string;
      starts_at?: {
        day?: number;
        month?: number;
        year?: number;
      };
      ends_at?: {
        day?: number;
        month?: number;
        year?: number;
      };
      location?: string;
    }>;
    skills?: Array<{
      name?: string;
    }>;
    education?: Array<{
      school?: string;
      degree_name?: string;
      field_of_study?: string;
      logo_url?: string;
      starts_at?: {
        year?: number;
      };
      ends_at?: {
        year?: number;
      };
    }>;
  };
}
