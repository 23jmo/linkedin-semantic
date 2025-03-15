import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("API route: /api/auth/create-user called");

    // Parse the request body
    const body = await request.json();
    console.log("Request body:", body);

    // Validate LinkedIn URL if user doesn't exist
    if (!body.linkedin_url) {
      console.error("LinkedIn URL is required");
      return NextResponse.json(
        { error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    console.log(
      `Forwarding request to ${backendUrl}/api/v1/profiles/create-user`
    );

    const response = await fetch(`${backendUrl}/api/v1/profiles/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Check if the response is ok
    if (!response.ok) {
      console.error(`Backend returned status ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: response.status }
      );
    }

    // Return the response from the backend
    const data = await response.json();
    console.log("Backend response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in create-user API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
