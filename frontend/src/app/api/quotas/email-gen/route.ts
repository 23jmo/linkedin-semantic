import { createClient } from "@supabase/supabase-js";
import {  NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  EmailGenerationQuotaSchema,
} from "@/types/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).schema("usage_tracking");

// Before sending any email, check the limit
export async function GET() {
  console.log("[email-gen] Starting GET request");

  const session = await auth();
  console.log("[email-gen] Session:", {
    exists: !!session,
    userId: session?.user?.id,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, ensure the user has a record
    console.log("[email-gen] Querying Supabase for user:", session.user.id);
    const { data: usage, error: queryError } = await supabase
      .from("email_generation_limits")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (queryError?.code === "PGRST116") { // user not in the table 
      console.log("[email-gen] No usage data found, creating initial record");

      const { data: newUsage, error: insertError } = await supabase
        .from("email_generation_limits")
        .insert({
          user_id: session.user.id,
          emails_generated_this_month: 0,
          monthly_limit: 10,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[email-gen] Insert error:", insertError);
        return NextResponse.json(
          { error: "Error inserting email generation limit" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        canSend: true,
        usage: newUsage,
      });
    }

    console.log("[email-gen] Raw usage data:", usage);
    const result = EmailGenerationQuotaSchema.safeParse(usage);

    if (!result.success) {
      console.error("[email-gen] Schema validation error:", result.error);
      return NextResponse.json(
        {
          error: "Error parsing email generation quota",
          details: result.error.issues,
        },
        { status: 500 }
      );
    }

    const usageData = result.data;

    // if (!usageData) {
    //   console.log("[email-gen] No usage data found, creating initial record");

    //   const { data: newUsage, error: insertError } = await supabase
    //     .from("email_generation_limits")
    //     .insert({
    //       user_id: session.user.id,
    //       emails_sent_this_month: 0,
    //       monthly_limit: 50,
    //     })
    //     .select()
    //     .single();


    //   if (insertError) {
    //     console.error("[email-gen] Insert error:", insertError);
    //     return NextResponse.json(
    //       { error: "Error inserting email generation limit" },
    //       { status: 500 }
    //     );
    //   }

    //   return NextResponse.json({
    //     canSend: true,
    //     usage: newUsage,
    //   });
    // }

    console.log("[email-gen] Returning usage data:", usageData);
    return NextResponse.json({
      canSend: usageData.emails_generated_this_month < usageData.monthly_limit,
      usage: {
        used: usageData.emails_generated_this_month,
        limit: usageData.monthly_limit,
        remaining: usageData.monthly_limit - usageData.emails_generated_this_month,
      },
    });
  } catch (error) {
    console.error("[email-gen] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
