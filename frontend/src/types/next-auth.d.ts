import NextAuth from "next-auth";

console.log(NextAuth);

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    /** JWT token for Supabase RLS */
    supabaseAccessToken?: string;
    /** Whether the user exists in our database */
    exists?: boolean;
    /** User's access token */
    accessToken?: string;
    /** User's refresh token */
    refreshToken?: string;
    /** The provider used for authentication */
    provider?: string;
    user: {
      /** The user's name */
      name?: string | null;
      /** The user's email address */
      email?: string | null;
      /** The user's image */
      image?: string | null;
      /** The user's access token */
      accessToken: string;
      /** The provider used for authentication */
      provider?: string;
      /** The user's LinkedIn ID */
      linkedinId?: string;
      /** The user's ID */
      id?: string;
    };
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's access token */
    accessToken?: string;
    /** The user's refresh token */
    refreshToken?: string;
    /** The provider used for authentication */
    provider?: string;
    /** The user's LinkedIn ID */
    linkedinId?: string;
    /** Token expiration timestamp */
    expiresAt?: number;
  }
}

// Add LinkedIn profile type
declare module "next-auth/providers/linkedin" {
  interface Profile {
    id: string;
    localizedFirstName?: string;
    localizedLastName?: string;
    emailAddress?: string;
    profilePicture?: {
      displayImage?: {
        elements?: Array<{
          identifiers?: Array<{
            identifier?: string;
          }>;
        }>;
      };
    };
  }
}
