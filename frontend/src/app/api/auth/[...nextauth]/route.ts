import NextAuth from "next-auth";
import LinkedInProvider from "next-auth/providers/linkedin";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Extend the Session type to include our custom properties
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken: string;
      idToken?: string;
      linkedinId: string;
      id: string;
      provider?: string;
    };
  }
}

// Extend the JWT type to include our custom properties
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    linkedinId?: string;
    expiresAt?: number;
  }
}

// Define LinkedIn profile type
interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  emailAddress?: string;
  profilePicture?: {
    displayImage?: string;
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      profile(profile) {
        // OpenID Connect profile structure is different from the old LinkedIn API
        return {
          id: profile.sub, // OpenID Connect uses 'sub' as the unique identifier
          name:
            profile.name ||
            `${profile.given_name} ${profile.family_name}`.trim(),
          email: profile.email,
          image: profile.picture || null,
        };
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error({ type: "inside error logger", code, metadata });
    },
    warn(code) {
      console.warn({ type: "inside warn logger", code });
    },
    debug(code, metadata) {
      console.log({ type: "inside debug logger", code, metadata });
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        // Include LinkedIn-specific data and tokens
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token; // Store the ID token from OpenID Connect
        token.linkedinId = profile.sub || token.sub; // OpenID Connect uses 'sub'
        token.expiresAt = account.expires_at;
      }

      // Return previous token if the access token has not expired yet
      return token;
    },
    async session({ session, token }) {
      // Add token data to the session
      session.user.accessToken = token.accessToken as string;
      session.user.idToken = token.idToken as string | undefined; // Make it optional
      session.user.linkedinId = (token.linkedinId || token.sub) as string;
      session.user.id = token.sub as string;

      return session;
    },
    // Add a redirect callback to ensure users are redirected to the main page after sign-in
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Default to the main page
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
