import NextAuth from "next-auth";
import { Session } from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { checkUserExists } from "@/lib/api";
import { storeEmailCredentials } from "@/lib/server/email-credentials";

// Extend the User type to include the exists property
declare module "next-auth" {
  interface Session {
    exists?: boolean;
    supabaseAccessToken?: string;
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.send",
          access_type: "offline",
          prompt: "consent",
        },
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

      // Add token information to the session
      if (token) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.provider = token.provider as string;
      }

      // Check if user exists in our database
      if (user?.id) {
        try {
          const response = await checkUserExists({ id: user.id }, {});
          session.exists = response.user_exists === true;
          console.log("User exists in database:", session.exists);
        } catch (error) {
          console.error("Error checking if user exists:", error);
          session.exists = false;
        }
      } else {
        session.exists = false;
      }

      return session;
    },

    async signIn({ user, account, profile, email, credentials }) {
      console.log("signIn callback triggered", {
        user: user?.email,
        accountType: account?.provider,
        hasProfile: !!profile,
      });

      // Always allow sign in - we'll check if the user exists in the JWT callback
      return true;
    },
    // It controls where the user is redirected after sign in
    async redirect({ url, baseUrl }) {
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
      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // Otherwise, redirect to the base URL (homepage)
      return baseUrl;
    },

    // This callback is called when the JWT token is created or updated
    async jwt({ token, account, profile, user }) {
      console.log("JWT callback called with user:", user);

      // Add the account info to the token if available
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at;

        // Store Gmail credentials in Supabase if provider is Google
        if (account.provider === "google" && user?.id) {
          try {
            await storeEmailCredentials(
              user.id,
              "gmail",
              account.access_token!,
              account.refresh_token!,
              account.expires_at || Math.floor(Date.now() / 1000) + 3600
            );
          } catch (error) {
            console.error("Error storing email credentials:", error);
          }
        }
      }

      // Add profile info to the token if available
      if (profile) {
        token.profile = profile;
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
