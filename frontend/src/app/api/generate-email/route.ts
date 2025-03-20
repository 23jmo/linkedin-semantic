import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prompt } from "./prompt";
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { recipientProfile, senderProfile, purpose } = await request.json();

    // Simple validation
    if (!recipientProfile || !purpose) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the request data
    console.log("OpenAI Request:", {
      recipientProfile: {
        id: recipientProfile.id,
        name: `${recipientProfile.firstName} ${recipientProfile.lastName}`,
        headline: recipientProfile.headline,
        // Include other basic fields but not the full raw_profile_data to keep logs clean
      },
      senderProfile: senderProfile,
      purpose: purpose,
    });

    // Generate email content using OpenAI with JSON mode
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: `Write a professional email from ${
            senderProfile ? JSON.stringify(senderProfile) : "me"
          } to ${JSON.stringify(recipientProfile)}. 
          
          The purpose of the email is: ${purpose}.
          
          `,
        },
      ],
      max_tokens: 500,
    });

    // Extract the generated email content as JSON
    const content = completion.choices[0]?.message?.content || "{}";

    // Log the OpenAI response
    console.log("OpenAI Response:", {
      model: completion.model,
      usage: completion.usage,
      content: content.substring(0, 100) + (content.length > 100 ? "..." : ""), // Log just the beginning
    });

    try {
      const emailData = JSON.parse(content);
      return NextResponse.json({
        subject: emailData.subject || "No subject generated",
        body: emailData.body || "No body generated",
      });
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return NextResponse.json({
        subject: "Error generating subject",
        body: content, // Return raw content as body if JSON parsing fails
      });
    }
  } catch (error) {
    console.error("Error generating email:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
