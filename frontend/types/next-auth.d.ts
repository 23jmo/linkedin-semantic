import "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in Session type to include a custom supabaseAccessToken property
   */
  interface Session {
    supabaseAccessToken?: string;
  }
}
