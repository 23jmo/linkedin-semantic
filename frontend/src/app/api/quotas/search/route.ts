import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SearchLimitsData, QuotaResponse } from "@/types/quota";
import { auth } from "@/auth";
/**
 * Default search quota for new users
 */
const DEFAULT_SEARCH_QUOTA_DB = {
  monthly_search_limit: 20,
  searches_this_month: 0,
  last_reset_date: new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  ).toISOString(),
};

/**
 * GET handler for search quota API
 * Retrieves the current search quota for the authenticated user
 */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ).schema("usage_tracking");

  // Check if user is authenticated
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      {
        quota: null,
        limitReached: false,
        error: "Unauthorized",
      } as QuotaResponse,
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // Get current quota from database
    const { data: dbData, error: dbError } = await supabase
      .from("search_limits")
      .select(
        "user_id, searches_this_month, monthly_search_limit, last_reset_date"
      )
      .eq("user_id", userId)
      .single();

    if (dbError && dbError.code !== "PGRST116") {
      console.error("Error fetching quota:", dbError);
      return NextResponse.json(
        {
          quota: null,
          limitReached: false,
          error: "Failed to retrieve quota information",
        } as QuotaResponse,
        { status: 500 }
      );
    }

    // If no quota exists, create a default one
    if (!dbData) {
      const newDbRecord = {
        user_id: userId!,
        ...DEFAULT_SEARCH_QUOTA_DB,
      };

      const { error: insertError } = await supabase
        .from("search_limits")
        .insert(newDbRecord);

      if (insertError) {
        console.error("Error creating quota:", insertError);
        return NextResponse.json(
          {
            quota: null,
            limitReached: false,
            error: "Failed to create quota",
          } as QuotaResponse,
          { status: 500 }
        );
      }

      // Prepare the quota data for the response
      const quotaResponseData: SearchLimitsData = {
        user_id: newDbRecord.user_id,
        searches_this_month: newDbRecord.searches_this_month,
        monthly_search_limit: newDbRecord.monthly_search_limit,
        last_reset_date: newDbRecord.last_reset_date,
      };

      return NextResponse.json({
        quota: quotaResponseData,
        limitReached: false,
        error: null,
      } as QuotaResponse);
    }

    // If record exists, prepare the quota data for the response
    const quotaResponseData: SearchLimitsData = {
      user_id: dbData.user_id,
      searches_this_month: dbData.searches_this_month,
      monthly_search_limit: dbData.monthly_search_limit,
      last_reset_date: dbData.last_reset_date,
    };

    return NextResponse.json({
      quota: quotaResponseData,
      limitReached:
        quotaResponseData.searches_this_month >=
        quotaResponseData.monthly_search_limit,
      error: null,
    } as QuotaResponse);
  } catch (error) {
    console.error("Unexpected error in GET /api/quotas/search:", error);
    return NextResponse.json(
      {
        quota: null,
        limitReached: false,
        error: "An unexpected error occurred",
      } as QuotaResponse,
      { status: 500 }
    );
  }
}

/**
 * POST handler for search quota API
 * Atomically creates or increments the search count for the authenticated user
 * Uses a Postgres function to handle the atomic upsert and increment operation
 */
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ).schema("usage_tracking");

  // Check if user is authenticated
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      {
        quota: null,
        limitReached: false,
        error: "Unauthorized",
      } as QuotaResponse,
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // Call the RPC function that atomically handles both record creation and count increment
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "upsert_and_increment_search_count",
      { input_user_id: userId }
    );

    if (rpcError) {
      console.error(
        "Error in upsert_and_increment_search_count RPC:",
        rpcError
      );
      return NextResponse.json(
        {
          quota: null,
          limitReached: false,
          error: "Failed to update search quota",
        } as QuotaResponse,
        { status: 500 }
      );
    }

    // The RPC function should return exactly one row
    if (!rpcResult || (Array.isArray(rpcResult) && rpcResult.length === 0)) {
      console.error(
        "No result returned from upsert_and_increment_search_count RPC"
      );
      return NextResponse.json(
        {
          quota: null,
          limitReached: false,
          error: "Failed to retrieve updated search quota",
        } as QuotaResponse,
        { status: 500 }
      );
    }

    // Get the first row if rpcResult is an array
    const resultRow = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;

    // Prepare the quota data for the response
    const quotaResponseData: SearchLimitsData = {
      user_id: resultRow.user_id,
      searches_this_month: resultRow.searches_this_month,
      monthly_search_limit: resultRow.monthly_search_limit,
      last_reset_date: resultRow.last_reset_date,
    };

    // If the limit was already reached before this operation
    // Return a 403 status with appropriate message
    if (resultRow.limit_was_reached) {
      return NextResponse.json(
        {
          quota: quotaResponseData,
          limitReached: true,
          error: "Search limit reached",
        } as QuotaResponse,
        { status: 403 }
      );
    }

    // Normal successful response
    return NextResponse.json({
      quota: quotaResponseData,
      limitReached:
        quotaResponseData.searches_this_month >=
        quotaResponseData.monthly_search_limit,
      error: null,
    } as QuotaResponse);
  } catch (error) {
    console.error("Unexpected error in POST /api/quotas/search:", error);
    return NextResponse.json(
      {
        quota: null,
        limitReached: false,
        error: "An unexpected error occurred while updating quota",
      } as QuotaResponse,
      { status: 500 }
    );
  }
}
