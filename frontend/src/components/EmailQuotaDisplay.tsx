import { useTheme } from "@/lib/theme-context";

interface EmailUsage {
  used: number;
  limit: number;
  remaining: number;
}

interface EmailQuotaDisplayProps {
  usage: EmailUsage | null;
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
        data-oid="gxsl6tc"
      >
        <div className="flex justify-between items-center" data-oid="i-p-2oi">
          <div
            className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded"
            data-oid=":-z8nue"
          />

          <div
            className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded"
            data-oid="tklxvu6"
          />
        </div>
      </div>
    ) : (
      // Dashboard skeleton
      <div
        className={`p-6 rounded-lg animate-pulse ${
          resolvedTheme === "light" ? "bg-white" : "bg-gray-800"
        } shadow`}
        data-oid="eej_hpf"
      >
        <div
          className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"
          data-oid="kq.4eiz"
        />

        <div
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"
          data-oid="tmnbymu"
        />

        <div className="grid grid-cols-3 gap-6" data-oid="q.5_nud">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${
                resolvedTheme === "light" ? "bg-gray-50" : "bg-gray-700"
              }`}
              data-oid="kqljph6"
            >
              <div
                className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-2"
                data-oid="4br8fpt"
              />

              <div
                className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded"
                data-oid="8xv5-jl"
              />
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
        data-oid="rp--8n6"
      >
        <p
          className={`text-sm ${
            resolvedTheme === "light" ? "text-red-600" : "text-red-400"
          }`}
          data-oid="pmjg7dk"
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
        data-oid="3o_qffn"
      >
        <div className="flex justify-between items-center" data-oid="9w9krc_">
          <span
            className={`text-sm ${
              resolvedTheme === "light" ? "text-gray-600" : "text-gray-300"
            }`}
            data-oid="2ynunzu"
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
            data-oid="8606gpd"
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
      data-oid="c629d_p"
    >
      <h2 className="text-xl font-semibold mb-4" data-oid="ny75dxv">
        Email Generation Quota
      </h2>

      {/* Progress bar */}
      <div
        className="relative h-3 bg-gray-200 dark:bg-gray-600 rounded-full mb-4"
        data-oid="ga:bsfp"
      >
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
            usage.remaining === 0
              ? "bg-red-500"
              : usage.remaining < usage.limit * 0.2
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{ width: `${(usage.used / usage.limit) * 100}%` }}
          data-oid="adf1m7q"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-6" data-oid="c06:n6h">
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
          data-oid="51fe.sg"
        >
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mb-1"
            data-oid="rf_9bi4"
          >
            Used
          </p>
          <p className="text-2xl font-bold" data-oid="cfmt:x:">
            {usage.used}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
          data-oid="hl15vyj"
        >
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mb-1"
            data-oid="y4_crx-"
          >
            Remaining
          </p>
          <p
            className={`text-2xl font-bold ${
              usage.remaining > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
            data-oid="6_oc.mt"
          >
            {usage.remaining}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
          data-oid="vwe8flj"
        >
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mb-1"
            data-oid="sggyp59"
          >
            Monthly Limit
          </p>
          <p className="text-2xl font-bold" data-oid="uv-l5gn">
            {usage.limit}
          </p>
        </div>
      </div>

      {/* Reset date info */}
      <p
        className="mt-4 text-sm text-gray-500 dark:text-gray-400"
        data-oid=":dsby14"
      >
        Quota resets on the 1st of each month
      </p>
    </div>
  );
}
