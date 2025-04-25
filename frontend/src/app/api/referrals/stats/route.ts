import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { generateReferralCode } from "@/lib/referral";

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

  // check if user in the referrals list - if not then create

  const { data: referralData, error: referralError } = await supabase
    .from("referrals")
    .select("referral_code")
    .eq("referrer_id", session.user.id)
    .single();

  if (referralError) {
    if (
      referralError.code === "PGRST106" ||
      referralError.code === "PGRST116"
    ) {
      // user not in the referrals list
      // create user in the referrals list

      // need to create a referral code for them

      const newReferralCode = generateReferralCode(
        session.user.id,
        session.user.email?.split("@")[0]
      );
      const { error: referralError } = await supabase.from("referrals").insert({
        referrer_id: session.user.id,
        referral_code: newReferralCode,
      });

      if (referralError) {
        console.error("Error creating referral:", referralError);
        return NextResponse.json(
          { error: "Error creating referral" },
          { status: 500 }
        );
      }
    } else {
      console.error("Error fetching referral data:", referralError);
      return NextResponse.json(
        { error: "Error fetching referral data" },
        { status: 500 }
      );
    }
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
