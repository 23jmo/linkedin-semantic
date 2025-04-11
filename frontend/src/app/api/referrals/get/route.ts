import { NextResponse } from "next/server";
import { generateReferralCode } from "@/lib/referral";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    ).schema("linkedin_profiles");

    // Get the current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Try to get existing referral code
    const { data: existingReferral, error: referralError } = await supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_id", session.user.id)
      .single();

    if (referralError) {
      console.error("Error fetching referral:", referralError);
    }

    if (existingReferral?.referral_code) {
      return NextResponse.json({
        referralCode: existingReferral.referral_code,
        isNew: false,
      });
    }

    // Generate new referral code
    const newReferralCode = generateReferralCode(
      session.user.id,
      session.user.email?.split("@")[0]
    );

    // Insert new referral code
    const { error: insertError } = await supabase.from("referrals").insert({
      referrer_id: session.user.id,
      referral_code: newReferralCode,
    });

    if (insertError) {
      console.error("Error creating referral:", insertError);
      return NextResponse.json(
        { error: "Failed to create referral code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      referralCode: newReferralCode,
      isNew: true,
    });
  } catch (error) {
    console.error("Referral API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
