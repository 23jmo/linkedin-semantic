import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SearchLimitsData, QuotaResponse } from "@/types/quota";
import { auth } from "@/auth";
/**
 * Default search quota for new users
 */
const DEFAULT_SEARCH_QUOTA_DB = {
  monthly_search_limit: 15,
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
 * Increments the search count for the authenticated user
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
    // Get current quota - IMPORTANT: Use SERVICE_ROLE key for reliable reads before increment
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ).schema("usage_tracking");

    const { data: currentDbData, error: fetchError } = await serviceSupabase
      .from("search_limits")
      .select(
        "user_id, searches_this_month, monthly_search_limit, last_reset_date"
      )
      .eq("user_id", userId)
      .single();

    // Handle case where user record doesn't exist yet (should ideally be created by GET first)
    if (fetchError && fetchError.code === "PGRST116") {
      console.warn(
        `Attempted POST for non-existent quota record for user ${userId}. Creating default.`
      );
      const newDbRecord = {
        user_id: userId!,
        ...DEFAULT_SEARCH_QUOTA_DB,
        searches_this_month: 1, // Start with 1 since this is the first increment
      };
      const { error: insertError } = await serviceSupabase
        .from("search_limits")
        .insert(newDbRecord);

      if (insertError) {
        console.error("Error creating quota during POST:", insertError);
        return NextResponse.json(
          { quota: null, limitReached: false, error: "Failed to create quota" },
          { status: 500 }
        );
      }
      const quotaResponseData: SearchLimitsData = {
        user_id: newDbRecord.user_id,
        searches_this_month: newDbRecord.searches_this_month,
        monthly_search_limit: newDbRecord.monthly_search_limit,
        last_reset_date: newDbRecord.last_reset_date,
      };
      return NextResponse.json({
        quota: quotaResponseData,
        limitReached:
          quotaResponseData.searches_this_month >=
          quotaResponseData.monthly_search_limit,
        error: null,
      } as QuotaResponse);
    }

    // Handle other fetch errors
    if (fetchError) {
      console.error("Error fetching quota before increment:", fetchError);
      return NextResponse.json(
        {
          quota: null,
          limitReached: false,
          error: "Failed to retrieve quota information",
        } as QuotaResponse,
        { status: 500 }
      );
    }

    // Check limit *before* incrementing
    if (
      currentDbData.searches_this_month >= currentDbData.monthly_search_limit
    ) {
      console.log(
        `---> User ${userId} search limit reached (${currentDbData.searches_this_month}/${currentDbData.monthly_search_limit}). Preparing 403 response.`
      );
      try {
        const quotaResponseData: SearchLimitsData = {
          user_id: currentDbData.user_id,
          searches_this_month: currentDbData.searches_this_month,
          monthly_search_limit: currentDbData.monthly_search_limit,
          last_reset_date: currentDbData.last_reset_date,
        };
        console.log("---> Constructed quotaResponseData:", quotaResponseData); // Log the object

        return NextResponse.json(
          {
            quota: quotaResponseData,
            limitReached: true,
            error: "Search limit reached",
          } as QuotaResponse,
          { status: 403 }
        );
      } catch (constructionError) {
        console.error(
          "---> ERROR constructing/returning 403 response:",
          constructionError
        );
        return NextResponse.json(
          { error: "Internal server error during quota limit check" },
          { status: 500 }
        );
      }
    }

    // Increment the used count using Supabase atomic increment function (RPC)
    // Assumes a function `increment_user_search_count` exists in `usage_tracking` schema
    // You might need to create this SQL function:
    // CREATE OR REPLACE FUNCTION usage_tracking.increment_user_search_count(user_id_param UUID)
    // RETURNS TABLE(user_id UUID, searches_this_month INT, monthly_search_limit INT, last_reset_date TIMESTAMPTZ) AS $$
    //   UPDATE usage_tracking.search_limits
    //   SET searches_this_month = searches_this_month + 1,
    //       updated_at = NOW()
    //   WHERE user_id = user_id_param
    //   RETURNING user_id, searches_this_month, monthly_search_limit, last_reset_date;
    // $$ LANGUAGE sql VOLATILE;

    const { data: updatedRpcData, error: rpcError } = await supabase.rpc(
      "increment_user_search_count",
      { user_id_param: userId }
    );

    console.log("increment_user_search_count", updatedRpcData);

    if (rpcError || !updatedRpcData) {
      console.error("Error incrementing quota via RPC:", rpcError);
      // Fallback to potentially less atomic update (consider implications)
      const { data: updatedManualData, error: updateManualError } =
        await serviceSupabase
          .from("search_limits")
          .update({
            searches_this_month: currentDbData.searches_this_month + 1,
          })
          .eq("user_id", userId)
          .select(
            "user_id, searches_this_month, monthly_search_limit, last_reset_date"
          )
          .single();

      if (updateManualError || !updatedManualData) {
        console.error("Error updating quota manually:", updateManualError);
        return NextResponse.json(
          { quota: null, limitReached: false, error: "Failed to update quota" },
          { status: 500 }
        );
      }
      const quotaResponseData: SearchLimitsData = {
        user_id: updatedManualData.user_id,
        searches_this_month: updatedManualData.searches_this_month,
        monthly_search_limit: updatedManualData.monthly_search_limit,
        last_reset_date: updatedManualData.last_reset_date,
      };
      return NextResponse.json({
        quota: quotaResponseData,
        limitReached:
          quotaResponseData.searches_this_month >=
          quotaResponseData.monthly_search_limit,
        error: null,
      } as QuotaResponse);
    }

    // If RPC succeeded, use its result
    const updatedDataFromRpc = Array.isArray(updatedRpcData)
      ? updatedRpcData[0]
      : updatedRpcData;
    const quotaResponseData: SearchLimitsData = {
      user_id: updatedDataFromRpc.user_id,
      searches_this_month: updatedDataFromRpc.searches_this_month,
      monthly_search_limit: updatedDataFromRpc.monthly_search_limit,
      last_reset_date: updatedDataFromRpc.last_reset_date,
    };

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
