import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ReferralLink() {
  const { data: session } = useSession();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferralCode() {
      if (!session?.user?.id) return;

      const response = await fetch("/api/referral/generate", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referralCode);
      }
      setLoading(false);
    }

    fetchReferralCode();
  }, [session]);

  if (!session) return null;

  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : "";

  return (
    <div className="p-4 bg-white rounded-lg shadow" data-oid=":g1sb66">
      <h2 className="text-lg font-semibold mb-2" data-oid="7fexda_">
        Your Referral Link
      </h2>
      {loading ? (
        <p data-oid=".rlf7af">Loading...</p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4" data-oid="qhc68o9">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 p-2 border rounded"
              data-oid="p.6r-mg"
            />

            <button
              onClick={() => navigator.clipboard.writeText(referralLink)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              data-oid="i:zvd:a"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-600" data-oid="b.94v6u">
            Share this link with friends. When they sign up using your link,
            you&apos;ll get +10 monthly emails!
          </p>
        </>
      )}
    </div>
  );
}
