import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prompt } from "./prompt";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
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
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const emailData = JSON.parse(content);
      await incrementEmailCount(session.user.id);
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("usage_tracking");

// After sending an email successfully, increment the count
async function incrementEmailCount(userId: string | undefined): Promise<void> {
  if (!userId) {
    console.error("[Generate-Email] User ID is undefined");
    return;
  }
  console.log("[Generate-Email] Incrementing email count for user:", userId);

  try {
    // First check if the record exists
    const { data: existingRecord, error: queryError } = await supabase
      .from("email_generation_limits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 means no rows returned
      console.error("[Generate-Email] Error checking record:", queryError);
      return;
    }

    if (!existingRecord) {
      // Create initial record
      const { error: insertError } = await supabase
        .from("email_generation_limits")
        .insert({
          user_id: userId,
          emails_generated_this_month: 1,
          monthly_limit: 50, // Default limit
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(
          "[Generate-Email] Error creating initial record:",
          insertError
        );
      }
      return;
    }

    // Update existing record
    const { error: updateError } = await supabase
      .from("email_generation_limits")
      .update({
        emails_generated_this_month:
          existingRecord.emails_generated_this_month + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        "[Generate-Email] Error incrementing email count:",
        updateError
      );
    }
  } catch (error) {
    console.error("[Generate-Email] Unexpected error:", error);
  }
}
