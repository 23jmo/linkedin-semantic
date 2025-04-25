"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface QuotaLimitErrorProps {
  referralCode: string | null;
}

export default function QuotaLimitError({
  referralCode,
}: QuotaLimitErrorProps) {
  const [copied, setCopied] = useState(false);

  // Construct referral link only if code exists
  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}` // Adjusted link to root with ref query param
    : null;

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      // Optionally reset copied state after a delay
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-red-700 p-6 rounded-xl shadow-md max-w-md mx-auto my-8 z-10 relative"
      data-oid="1eens62"
    >
      <div className="flex items-center mb-4" data-oid="qqu9472">
        <ExclamationTriangleIcon
          className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0"
          data-oid="w3jd4a1"
        />

        <motion.h3
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-red-800 dark:text-red-200"
          data-oid="3e3_hqr"
        >
          Search Limit Reached
        </motion.h3>
      </div>
      <motion.p
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="text-base mb-4 leading-relaxed text-red-700 dark:text-red-300"
        data-oid="ohv:tzs"
      >
        You&apos;ve used all your searches for this month.
        {
          referralLink
            ? " Refer a friend using the link below to get +10 searches!"
            : " Upgrade your plan for more searches." // Fallback message if no referral code
        }
      </motion.p>

      {referralLink && (
        <div
          className="flex flex-col sm:flex-row gap-3 mt-5"
          data-oid=":m392c9"
        >
          <motion.input
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            type="text"
            value={referralLink}
            readOnly
            className="flex-grow p-3 text-base border rounded-lg bg-white dark:bg-gray-700 border-red-300 dark:border-red-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500"
            aria-label="Referral Link"
            data-oid="3e80c80"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`px-5 py-3 rounded-lg text-base font-medium transition-colors ${
              copied
                ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                : "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
            }`}
            data-oid="2ftscrt"
          >
            {copied ? "Copied!" : "Copy Link"}
          </motion.button>
        </div>
      )}

      {/* Consider adding a link to billing/upgrade page if applicable */}
      {/* <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 text-center"> */}
      {/*   <a href="/billing" className="text-sm text-red-600 dark:text-red-400 hover:underline">Upgrade Plan</a> */}
      {/* </motion.div> */}
    </motion.div>
  );
}
