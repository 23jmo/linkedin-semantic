import NextAuth from "next-auth";
import { Session } from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { checkUserExists, createUser } from "@/lib/api";
import * as jose from 'jose';
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
  // Add callbacks to handle redirects and session management
  callbacks: {
    async session({ session, user }) {
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
        // Check if the user already exists in the database
        try {
          const signingSecret = process.env.SUPABASE_JWT_SECRET;
          if (signingSecret) {
            const secret = new TextEncoder().encode(signingSecret);
            const token = await new jose.SignJWT({
              aud: "authenticated",
              exp: Math.floor(new Date().getTime() / 1000) + 60 * 60,
              sub: user.id,
              email: user.email,
              role: "authenticated",
            })
              .setProtectedHeader({ alg: "HS256" })
              .sign(secret);

            // Now use this token
            const response = await fetch(
              `${process.env.BACKEND_URL}/api/v1/profiles/check-user-exists`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  userId: user.id,
                  linkedInOAuthProfile: profile,
                }),
              }
            );

            // Handle response
            const data = await response.json();
            console.log("User check response:", data);
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return true;
        }
      }

      return true;
    },
    // It controls where the user is redirected after sign in
    async redirect({ url, baseUrl }) {
      // If the URL is relative, prepend the base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If the URL is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Otherwise, redirect to the base URL (homepage)
      return baseUrl;
    },
    // This callback is called whenever a session is checked
    // You can use it to customize the session object

    // This callback is called when the JWT token is created or updated
    async jwt({ token, account, profile }) {
      // Add the account info to the token if available
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      // Add profile info to the token if available
      if (profile) {
        token.profile = profile;
      }
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
