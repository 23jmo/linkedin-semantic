import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("referral_code")?.value;

  return NextResponse.json({
    referralCode,
    allCookies: Object.fromEntries(
      cookieStore.getAll().map((cookie) => [cookie.name, cookie.value])
    ),
  });
}
