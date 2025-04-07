import { useTheme } from "@/lib/theme-context";
import { EmailGenerationQuota } from "@/types/types";

interface EmailQuotaDisplayProps {
  usage: EmailGenerationQuota | null;
  isLoading?: boolean;
  quotaError?: string | null;
  variant?: "compact" | "dashboard";
}

export default function EmailQuotaDisplay({
  usage,
  isLoading = false,
  quotaError = null,
  variant = "compact",
}: EmailQuotaDisplayProps) {
  const { resolvedTheme } = useTheme();

  if (isLoading) {
    return variant === "compact" ? (
      // Compact skeleton (for EmailComposer)
      <div
        className={`mb-4 p-3 rounded-md animate-pulse ${
          resolvedTheme === "light" ? "bg-gray-50" : "bg-gray-700"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
      </div>
    ) : (
      // Dashboard skeleton
      <div
        className={`p-6 rounded-lg animate-pulse ${
          resolvedTheme === "light" ? "bg-white" : "bg-gray-800"
        } shadow`}
      >
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${
                resolvedTheme === "light" ? "bg-gray-50" : "bg-gray-700"
              }`}
            >
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-2" />
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (quotaError) {
    return (
      <div
        className={`mb-4 p-3 rounded-md ${
          resolvedTheme === "light" ? "bg-red-50" : "bg-red-900"
        }`}
      >
        <p
          className={`text-sm ${
            resolvedTheme === "light" ? "text-red-600" : "text-red-400"
          }`}
        >
          {quotaError}
        </p>
      </div>
    );
  }

  if (!usage) return null;

  if (variant === "compact") {
    return (
      <div
        className={`mb-4 p-3 rounded-md ${
          resolvedTheme === "light" ? "bg-gray-50" : "bg-gray-700"
        }`}
      >
        <div className="flex justify-between items-center">
          <span
            className={`text-sm ${
              resolvedTheme === "light" ? "text-gray-600" : "text-gray-300"
            }`}
          >
            Email Quota: {usage.used}/{usage.limit}
          </span>
          <span
            className={`text-sm ${
              usage.remaining > 0
                ? resolvedTheme === "light"
                  ? "text-green-600"
                  : "text-green-400"
                : resolvedTheme === "light"
                ? "text-red-600"
                : "text-red-400"
            }`}
          >
            {usage.remaining} remaining
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        resolvedTheme === "dark"
          ? "bg-gray-800 text-white"
          : "bg-white text-gray-900"
      } shadow rounded-lg p-6`}
    >
      <h2 className="text-xl font-semibold mb-4">Email Generation Quota</h2>

      {/* Progress bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-600 rounded-full mb-4">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
            usage.remaining === 0
              ? "bg-red-500"
              : usage.remaining < usage.limit * 0.2
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${(usage.used / usage.limit) * 100}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-6">
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Used</p>
          <p className="text-2xl font-bold">{usage.used}</p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Remaining
          </p>
          <p
            className={`text-2xl font-bold ${
              usage.remaining > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {usage.remaining}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Monthly Limit
          </p>
          <p className="text-2xl font-bold">{usage.limit}</p>
        </div>
      </div>

      {/* Reset date info */}
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Quota resets on the 1st of each month
      </p>
    </div>
  );
}
