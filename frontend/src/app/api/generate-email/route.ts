import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prompt } from "./prompt";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { ProfileFrontend, Education, Experience, Project } from "@/types/types";
import {
  ensureValidProfile,
  transformRawToFrontendProfile,
} from "@/lib/utils/profile-transformers";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const convertProfileToReadableString = (profile: ProfileFrontend) => {
  const education = profile.raw_profile_data?.education?.map(
    (edu: Education) => {
      return `
    ${edu.school} - ${edu.starts_at?.year} - ${edu.ends_at?.year}
      ${edu.degree_name ? `- ${edu.degree_name} in ${edu.field_of_study}:` : ""}
      ${edu.description ? `- ${edu.description}` : ""}
      ${edu.activities_and_societies ? `- ${edu.activities_and_societies}` : ""}
    `;
    }
  );

  const experience = profile.raw_profile_data?.experiences?.map(
    (exp: Experience) => {
      return `
    ${exp.company} - ${exp.title} - ${exp.start_at?.year} - ${
        exp.ends_at?.year || "Present"
      }
      ${exp.description ? `- ${exp.description}` : ""}
    `;
    }
  );

  const projects = profile.raw_profile_data?.accomplishment_projects?.map(
    (project: Project) => {
      return `- ${project.title} - ${project.description} - ${
        project.starts_at?.year
      } - ${project.ends_at?.year || "Present"}`;
    }
  );

  return `
    ===== Begin Profile for ${profile.firstName} ${profile.lastName} =====
    Headline: ${profile.headline}
    Location: ${profile.location}
    Summary: ${profile.summary}
    ----------
    Education: 
    ${education || "No education data available"}
    ----------
    Experience: 
    ${experience || "No experience data available"}
    ----------
    Projects: ${projects || "No project data available"}
    ----------
    Skills: ${profile.raw_profile_data?.skills || "No skills data available"}
    ===== End Profile for ${profile.firstName} ${profile.lastName} =====
  `;
};

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const {
      recipientProfile: rawRecipientProfile,
      senderProfile: rawSenderProfile,
      purpose,
    } = requestData;

    console.log("Raw recipient profile:", rawRecipientProfile);
    console.log("Raw sender profile:", rawSenderProfile);

    // Simple validation
    if (!rawRecipientProfile || !purpose) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure profiles are valid and conform to ProfileFrontend type

    console.log(
      "Raw sender profile right before transformation:",
      rawSenderProfile
    );
    console.log(
      "Raw recipient profile right before transformation:",
      rawRecipientProfile
    );

    const senderProfile = rawSenderProfile as ProfileFrontend;
    const recipientProfile = rawRecipientProfile as ProfileFrontend;

    console.log("Sender profile after transformation:", senderProfile);
    console.log("Recipient profile after transformation:", recipientProfile);

    // Log profile transformation result
    // console.log(`[API:/api/generate-email] Profiles transformed:`, {
    //   sender: `${senderProfile.firstName} ${senderProfile.lastName}`,
    //   recipient: `${recipientProfile.firstName} ${recipientProfile.lastName}`,
    // });

    // convert the two profiles into a more readable string
    const readableSenderProfileString =
      convertProfileToReadableString(senderProfile);
    const readableRecipientProfileString =
      convertProfileToReadableString(recipientProfile);
    // Generate email content using OpenAI with JSON mode

    console.log(
      `OpenAI Request:
      Prompt: ${prompt}
      Sender: ${readableSenderProfileString}
      Recipient: ${readableRecipientProfileString}
      Purpose: ${purpose}`
    );
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
          content: `Sender: ${readableSenderProfileString}
          Recipient: ${readableRecipientProfileString}
          Purpose: ${purpose}.    
          `,
        },
      ],
      max_completion_tokens: 500,
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
