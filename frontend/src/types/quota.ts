// Types for quota usage
export type SearchQuotaType = "normal" | "warning" | "exceeded" | "unknown";
export type EmailQuotaType = "normal" | "warning" | "exceeded" | "unknown";

/**
 * Search quota usage information - Represents core data from DB
 */
export interface SearchLimitsData {
  user_id: string;
  searches_this_month: number;
  monthly_search_limit: number;
  last_reset_date: string;
}

export interface EmailQuotaUsage {
  used: number;
  monthly_limit: number;
}

/**
 * Response format for quota-related API endpoints
 */
export interface QuotaResponse {
  quota: SearchLimitsData | null;
  limitReached: boolean;
  error: string | null;
}
