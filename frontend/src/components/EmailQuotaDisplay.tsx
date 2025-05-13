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
        data-oid="cbt_ita"
      >
        <div className="flex justify-between items-center" data-oid="9hb9pss">
          <div
            className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded"
            data-oid="irr-rks"
          />

          <div
            className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded"
            data-oid="3j62ycj"
          />
        </div>
      </div>
    ) : (
      // Dashboard skeleton
      <div
        className={`p-6 rounded-lg animate-pulse ${
          resolvedTheme === "light" ? "bg-white" : "bg-gray-800"
        } shadow`}
        data-oid="0wb1hn3"
      >
        <div
          className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"
          data-oid="t2lus10"
        />

        <div
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"
          data-oid="qt-i-nj"
        />

        <div className="grid grid-cols-3 gap-6" data-oid="z_f893w">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${
                resolvedTheme === "light" ? "bg-gray-50" : "bg-gray-700"
              }`}
              data-oid="jl.d01r"
            >
              <div
                className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-2"
                data-oid="_y9.5jm"
              />

              <div
                className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded"
                data-oid="sst7yt1"
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
        data-oid="e4j9_-r"
      >
        <p
          className={`text-sm ${
            resolvedTheme === "light" ? "text-red-600" : "text-red-400"
          }`}
          data-oid="9my0qj4"
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
        data-oid="a8s.5wf"
      >
        <div className="flex justify-between items-center" data-oid="dmoq8pe">
          <span
            className={`text-sm ${
              resolvedTheme === "light" ? "text-gray-600" : "text-gray-300"
            }`}
            data-oid="216.btk"
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
            data-oid="9cdfxnh"
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
      data-oid="z8i_czc"
    >
      <h2 className="text-xl font-semibold mb-4" data-oid="d7.jhzq">
        Email Generation Quota
      </h2>

      {/* Progress bar */}
      <div
        className="relative h-3 bg-gray-200 dark:bg-gray-600 rounded-full mb-4"
        data-oid="oy38jku"
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
          data-oid="jpqgunh"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-6" data-oid="b.:26bo">
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
          data-oid="_cmbuy0"
        >
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mb-1"
            data-oid="fws9.sv"
          >
            Used
          </p>
          <p className="text-2xl font-bold" data-oid="xt8pkc1">
            {usage.used}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
          data-oid="l_0r3k-"
        >
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mb-1"
            data-oid=":ry_na:"
          >
            Remaining
          </p>
          <p
            className={`text-2xl font-bold ${
              usage.remaining > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
            data-oid="cgjb3dj"
          >
            {usage.remaining}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
          }`}
          data-oid="u6_6d6u"
        >
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mb-1"
            data-oid="qm5..t4"
          >
            Monthly Limit
          </p>
          <p className="text-2xl font-bold" data-oid="pjdltr3">
            {usage.limit}
          </p>
        </div>
      </div>

      {/* Reset date info */}
      <p
        className="mt-4 text-sm text-gray-500 dark:text-gray-400"
        data-oid="ag8mm8b"
      >
        Quota resets on the 1st of each month
      </p>
    </div>
  );
}
