// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt";

// // We're not using middleware for authentication anymore
// // since we're handling it client-side in the components
// export async function middleware(request: NextRequest) {
//   return NextResponse.next();
// }

// // Empty matcher since we're not using middleware for authentication
// export const config = {
//   matcher: [],
// };

export { auth as middleware } from "@/auth";