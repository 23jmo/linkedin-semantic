import { handlers } from "@/auth";
export const { GET, POST } = handlers;

// import { Auth } from "@auth/core";
// import LinkedIn from "@auth/core/providers/linkedin";

// const request = new Request(origin);

// // Extend the Session type to include our custom properties
// declare module "next-auth" {
//   interface Session {
//     user: {
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       accessToken: string;
//       id: string;
//     };
//   }
// }

// // Extend the JWT type to include our custom properties
// declare module "next-auth/jwt" {
//   interface JWT {
//     accessToken?: string;
//     id?: string;
//   }
// }

// // Create the Auth.js handler with minimal configuration

// const handler = await Auth(request, {
//   providers: [
//     LinkedIn({
//       clientId: process.env.LINKEDIN_CLIENT_ID,
//       clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, account }) {
//       if (account) {
//         token.accessToken = account.access_token;
//         token.id = account.providerAccountId;
//       }
//       return token;
//     },
//     // async session({ session, token }) {
//     //   session.user.accessToken = token.accessToken as string;
//     //   session.user.id = token.id as string;
//     //   return session;
//     // },
//   },
//   pages: {
//     signIn: "/auth/signin",
//     error: "/auth/error",
//   },
//   debug: process.env.NODE_ENV === "development",
// });

// export { handler as GET, handler as POST };
