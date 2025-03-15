import { NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";
import { hasGmailConnected, sendEmail } from "@/lib/server/gmail-service";
import { storeEmailHistory } from "@/lib/server/email-credentials";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userName = session.user.name || "Me";

    // Parse request body
    const body = await request.json();
    const { profiles, purpose, notes } = body;

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { message: "At least one profile is required" },
        { status: 400 }
      );
    }

    if (!purpose) {
      return NextResponse.json(
        { message: "Purpose is required" },
        { status: 400 }
      );
    }

    // Check if user has Gmail connected
    const hasGmail = await hasGmailConnected(userId);
    if (!hasGmail) {
      return NextResponse.json(
        {
          message:
            "Gmail account not connected. Please connect your Gmail account to send emails.",
        },
        { status: 403 }
      );
    }

    // Generate and send emails for each profile
    const emailPromises = profiles.map(async (profile) => {
      const profileNote = notes[profile.id] || "";

      // Generate email content with OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at writing personalized cold emails that are professional, concise, and effective.",
          },
          {
            role: "user",
            content: `Write a personalized cold email to ${profile.firstName} ${
              profile.lastName
            } who works in ${profile.industry || "their industry"}. 
            Their LinkedIn headline is: "${profile.headline || ""}".
            The purpose of this email is: ${purpose}.
            Additional notes: ${profileNote}
            
            The email should be from ${userName}.
            Keep it under 200 words, professional, and with a clear call to action.
            Format as HTML with appropriate paragraph breaks.`,
          },
        ],
      });

      const emailContent = completion.choices[0].message.content || "";
      const subject = `Connecting with ${profile.firstName} ${profile.lastName}`;

      // Get recipient email (in a real app, you'd extract this from LinkedIn data)
      // For now, we'll use a placeholder
      const recipientEmail = `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}@example.com`;

      // Send the email
      await sendEmail(userId, recipientEmail, subject, emailContent);

      // Store in email history
      await storeEmailHistory(
        userId,
        profile.id,
        `${profile.firstName} ${profile.lastName}`,
        recipientEmail,
        subject,
        emailContent
      );

      return {
        recipient: {
          name: `${profile.firstName} ${profile.lastName}`,
          email: recipientEmail,
        },
        subject,
        content: emailContent,
      };
    });

    const generatedEmails = await Promise.all(emailPromises);

    return NextResponse.json({
      message: "Emails sent successfully",
      emails: generatedEmails,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}
