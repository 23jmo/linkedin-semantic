import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ProfileDeleteRequestSchema,
  ErrorResponse,
  ProfileDeleteResponse,
} from "@/types/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("linkedin_profiles");

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const result = ProfileDeleteRequestSchema.safeParse(body);
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        error: result.error.issues[0].message,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { user_id } = result.data;

    console.log("Deleting user with User ID:", user_id);

    // Check if user exists in database
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user_id);

    if (error) {
      console.error("Error checking user:", error);
      const errorResponse: ErrorResponse = {
        error: "Database error",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Validate response against schema
    const response: ProfileDeleteResponse = {
      success: true,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in check-user-exists:", error);
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
//   try {
//     // Parse the request body
//     const body = await request.json();

//     // Forward the request to the FastAPI backend
//     const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
//     const response = await fetch(`${backendUrl}/api/v1/profiles/delete-user`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body),
//     });

//     // Check if the response is ok
//     if (!response.ok) {
//       const errorText = await response.text();
//       return NextResponse.json(
//         { error: "Failed to delete user" },
//         { status: response.status }
//       );
//     }

//     // Return the response from the backend
//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
