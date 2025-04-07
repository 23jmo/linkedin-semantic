import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { EmailGenerationQuotaRequestSchema, EmailGenerationQuotaSchema } from "@/types/types";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
).schema("usage_tracking");

// Before sending any email, check the limit
export async function POST(request: NextRequest) {

  const res = EmailGenerationQuotaRequestSchema.safeParse(await request.json());
  if (!res.success) {
    return NextResponse.json(
      { error: res.error.issues[0].message },
      { status: 400 }
    );
  }

  const { user_id } = res.data;
  // First, ensure the user has a record
  const { data: usage } = await supabase
    .from("usage_tracking.email_generation_limits")
    .select("*")
    .eq("user_id", user_id)
    .single();

  const result = EmailGenerationQuotaSchema.safeParse(usage);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Error parsing email generation quota",
      },
      { status: 500 }
    );
  }

  const usageData = result.data;

  if (!usageData) {
    // Create initial record if doesn't exist
    await supabase.from("email_generation_limits").insert({
      user_id: user_id,
      emails_sent_this_month: 0,
      monthly_limit: undefined, // TODO: this needs to populate differently based on free, pro, etc. 
    });
  }

  // Check if user has reached their limit
  return NextResponse.json({
    used: usageData.emails_generated_this_month,
    limit: usageData.monthly_limit,
    remaining:
      (usageData.monthly_limit) - (usageData.emails_generated_this_month),
  });
}
