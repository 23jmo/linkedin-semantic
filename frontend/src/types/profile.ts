export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  profileUrl: string;
  profilePicture?: string;
  highlights?: string[];
}
