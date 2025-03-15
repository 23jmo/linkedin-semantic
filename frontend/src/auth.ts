import NextAuth from "next-auth";
import { Session } from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { checkUserExists, createUser } from "@/lib/api";

// Extend the User type to include the exists property
declare module "next-auth" {
  interface User {
    exists?: boolean;
    needsProfile?: boolean;
  }

  interface Session {
    exists?: boolean;
    needsProfile?: boolean;
    supabaseAccessToken?: string;
  }
}

// Configure NextAuth with proper callback handling
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID!,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET!,
      // Simplified authorization configuration
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile email",
        },
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
      },
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
      },
    }),
  ],
  // Make sure to use the NEXTAUTH_SECRET for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
  // Add callbacks to handle redirects and session management
  callbacks: {
    async session({ session, user, token }) {
      console.log("Session callback called with user:", user);
      console.log("Session callback called with token:", token);

      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user.id,
          email: user.email,
          role: "authenticated",
        };
        session.supabaseAccessToken = jwt.sign(payload, signingSecret);
      }

      // Check if this user exists in our database
      try {
        // Only perform this check if we don't already have the exists flag
        if (token?.exists === undefined && user?.id) {
          console.log("Checking if user exists in database:", user.id);
          // Use the user ID to check if the user exists in the database
          const userExistsResponse = await fetch(
            `${process.env.NEXTAUTH_URL}/api/auth/check-user-exists`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user.id,
                linkedin_auth: {},
              }),
            }
          );

          if (userExistsResponse.ok) {
            const data = await userExistsResponse.json();
            console.log("User exists check response:", data);
            session.exists = data.user_exists === true;
            session.needsProfile = !session.exists;
            console.log(
              "Setting session.exists from API check:",
              session.exists
            );
            return session;
          }
        }
      } catch (error) {
        console.error(
          "Error checking if user exists in session callback:",
          error
        );
        // Continue with normal flow if check fails
      }

      // Pass the exists flag from token to session
      // The token should have the exists property from the JWT callback
      if (token && typeof token.exists === "boolean") {
        // Make sure to set this explicitly to ensure it's properly typed
        session.exists = token.exists === true;
        console.log("Setting session.exists from token:", session.exists);
      } else if (user && typeof user.exists === "boolean") {
        // Make sure to set this explicitly to ensure it's properly typed
        session.exists = user.exists === true;
        console.log("Setting session.exists from user:", session.exists);
      } else {
        // If we don't have an exists flag, default to false to force profile completion
        session.exists = false;
        console.log(
          "No exists flag found in token or user, defaulting to false"
        );
      }

      // Pass the needsProfile flag from token to session
      if (token && typeof token.needsProfile === "boolean") {
        session.needsProfile = token.needsProfile;
        console.log(
          "Setting session.needsProfile from token:",
          session.needsProfile
        );
      } else if (user && typeof user.needsProfile === "boolean") {
        session.needsProfile = user.needsProfile;
        console.log(
          "Setting session.needsProfile from user:",
          session.needsProfile
        );
      }

      return session;
    },
    // This callback is called after a user is successfully authenticated

    async signIn({ user, account, profile, email, credentials }) {
      console.log("signIn callback triggered", {
        user: user?.email,
        accountType: account?.provider,
        hasProfile: !!profile,
      });

      if (account?.provider === "linkedin") {
        try {
          // Check if the user already exists in the database
          console.log("Checking if user exists:", user.id);
          const response = await checkUserExists(user, profile);
          console.log("User exists response:", response);

          // Store the user existence status in the user object for use in redirect callback
          user.exists = response.user_exists === true;

          console.log("User exists check:", user.exists);

          // If the user doesn't exist, set a flag to redirect to the complete-profile page
          if (user.exists === false) {
            console.log(
              "User doesn't exist, will redirect to complete-profile"
            );
            // We'll use this in the redirect callback
            user.needsProfile = true;
          } else {
            // User exists, explicitly set needsProfile to false
            console.log("User exists, no profile completion needed");
            user.needsProfile = false;
          }

          // We'll handle user creation in the complete-profile page
          return true;
        } catch (error) {
          console.error("Error checking if user exists:", error);
          // Allow sign in even if the check fails
          return true;
        }
      }

      return true;
    },
    // It controls where the user is redirected after sign in
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback called with url:", url);

      // If the URL is for the complete-profile page, allow it
      if (url.includes("/complete-profile")) {
        console.log("Redirecting to complete-profile page");
        return url;
      }

      // If the URL is for the sign-in page, redirect to the base URL
      if (url.includes("/api/auth/signin")) {
        console.log("Redirecting from sign-in page to base URL");
        return baseUrl;
      }

      // If the URL is relative, prepend the base URL
      if (url.startsWith("/")) {
        console.log("Redirecting to relative URL:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      // If the URL is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        console.log("Redirecting to same origin URL:", url);
        return url;
      }
      // Otherwise, redirect to the base URL (homepage)
      console.log("Redirecting to base URL:", baseUrl);
      return baseUrl;
    },

    // This callback is called when the JWT token is created or updated
    async jwt({ token, account, profile, user }) {
      console.log("JWT callback called with user:", user);

      // Add the account info to the token if available
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      // Add profile info to the token if available
      if (profile) {
        token.profile = profile;
      }
      // Add the exists flag to the token if available
      if (user && typeof user.exists === "boolean") {
        // Make sure to set this explicitly to ensure it's properly typed
        token.exists = user.exists === true;
        console.log("Setting token.exists from user:", token.exists);
      }

      // Add the needsProfile flag to the token if available
      if (user && typeof user.needsProfile === "boolean") {
        token.needsProfile = user.needsProfile;
        console.log(
          "Setting token.needsProfile from user:",
          token.needsProfile
        );
      }

      // For debugging - log the final token
      console.log("Final JWT token:", JSON.stringify(token, null, 2));

      return token;
    },
  },
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  pages: {
    // Customize the sign-in page URL
    signIn: "/",
    // Customize the error page URL
    error: "/",
    // Customize the sign-out page URL
    signOut: "/",
  },
  // Debug mode for development (remove in production)
  debug: process.env.NODE_ENV === "development",
});
