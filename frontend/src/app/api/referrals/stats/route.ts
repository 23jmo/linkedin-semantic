import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ).schema("linkedin_profiles");

  // Get referral code and count of successful referrals
  const { data: referralData, error: referralError } = await supabase
    .from("referrals")
    .select("referral_code")
    .eq("referrer_id", session.user.id)
    .single();

  if (referralError) {
    console.error("Error fetching referral data:", referralError);
  }

  const { data: referredCount, error: referredCountError } = await supabase
    .from("referred")
    .select("id", { count: "exact" })
    .eq("referrer_id", session.user.id);

  if (referredCountError) {
    console.error("Error fetching referred count:", referredCountError);
  }

  return NextResponse.json({
    referralCode: referralData?.referral_code || null,
    referralCount: referredCount?.length || 0,
  });
}
