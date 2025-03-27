import NextAuth from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";
import jwt from "jsonwebtoken";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";
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
  trustHost: true,
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
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  // Add callbacks to handle redirects and session management
  callbacks: {
    async session({ session, user, token }) {
      // Safety check for token
      if (!token) {
        return session;
      }

      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      if (signingSecret && token.sub) {
        // Check for token.sub instead of user.id
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub,
          email: token.email,
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

      // Only proceed with Supabase checks if we have a user ID from the token
      if (token.sub) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: userData } = await supabase
          .schema("next_auth")
          .from("users")
          .select("*")
          .eq("id", token.sub)
          .single();

        const { data: profileData } = await supabase
          .schema("linkedin_profiles")
          .from("profiles")
          .select("*")
          .eq("user_id", token.sub)
          .single();

        session.exists = !!userData && !!profileData;
      } else {
        session.exists = false;
      }

      return session;
    },

    async signIn(
      {
        /*user, account, profile, email, credentials */
      }
    ) {
      // Always allow sign in - we'll check if the user exists in the JWT callback
      return true;
    },
    // It controls where the user is redirected after sign in
    async redirect({ url, baseUrl }) {
      // If the URL is for the complete-profile page, allow it
      if (url.includes("/complete-profile")) {
        return url;
      }

      // If the URL is for the sign-in page, redirect to the base URL
      if (url.includes("/api/auth/signin")) {
        return baseUrl;
      }

      // If the URL is relative, prepend the base URL
      if (url.startsWith("/")) {
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
    async jwt({ token, account, profile }) {
      // Add the account info to the token if available
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at;
      }

      // Add profile info to the token if available
      if (profile) {
        token.profile = profile;
      }

      return token;
    },
  },
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
  debug: false,
});
