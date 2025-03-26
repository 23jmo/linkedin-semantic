import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Forward the request to the FastAPI backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/v1/search/semantic-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Check if the response is ok
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to perform semantic search" },
        { status: response.status }
      );
    }

    // Return the response from the backend
    const data = await response.json();
    // console.log("Data:", data);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 }
    );
  }
}
