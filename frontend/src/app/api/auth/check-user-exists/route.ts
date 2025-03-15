import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("API route: /api/auth/check-user-exists called");

    // Get the authorization header

    // Parse the request body
    const body = await request.json();
    console.log("Request body:", body);

    // Forward the request to the FastAPI backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    console.log(
      `Forwarding request to ${backendUrl}/api/v1/profiles/check-user-exists`
    );

    const response = await fetch(
      `${backendUrl}/api/v1/profiles/check-user-exists`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    // Check if the response is ok
    if (!response.ok) {
      console.error(`Backend returned status ${response.status}`);
      //const errorText = await response.text();
      //console.error(`Error response: ${errorText}`);
      return NextResponse.json(
        { error: "Failed to check user existence" },
        { status: response.status }
      );
    }

    // Return the response from the backend
    const data = await response.json();
    console.log("Backend response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in check-user-exists API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
