"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "referral_popup_dismissed";

export default function ReferralPopup() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<{
    referralCode: string | null;
    referralCount: number;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if popup was previously dismissed in this session
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
    if (isDismissed) return;

    // Show popup after 30 seconds if user hasn't referred anyone
    const timer = setTimeout(() => {
      if (stats?.referralCount && stats.referralCount < 10) {
        setShowPopup(true);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [stats?.referralCount]);

  useEffect(() => {
    async function fetchStats() {
      if (session?.user?.id) {
        const res = await fetch("/api/referrals/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      }
    }
    fetchStats();
  }, [session?.user?.id]);

  const handleDismiss = () => {
    setShowPopup(false);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  if (!stats?.referralCode) return null;

  const referralLink = `${window.location.origin}/ref=${stats.referralCode}`;

  return (
    <AnimatePresence data-oid="4dej213">
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
          }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-[90vw] sm:max-w-md z-[9999]"
          data-oid="t6i.25x"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDismiss}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 text-lg sm:text-xl"
            data-oid="t8b.g.1"
          >
            ×
          </motion.button>
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-blue-600 dark:text-blue-400"
            data-oid="to-sbj-"
          >
            Share with Friends! 👋
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed"
            data-oid="eqqn58h"
          >
            Share your referral link and get{" "}
            <span
              className="font-semibold text-blue-600 dark:text-blue-400"
              data-oid="1h-imb:"
            >
              +10 monthly emails
            </span>{" "}
            for each friend who joins!
          </motion.p>
          <div
            className="flex flex-col sm:flex-row gap-2 sm:gap-3"
            data-oid="uvy.el8"
          >
            <motion.input
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 p-2 sm:p-3 text-xs sm:text-base border rounded-lg bg-gray-50 dark:bg-gray-700"
              data-oid="3envs7d"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                setCopied(true);
                handleDismiss();
                toast.success("Referral link copied to clipboard!");
              }}
              className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base font-medium mt-2 sm:mt-0"
              data-oid="kkdggar"
            >
              {copied ? "Copied!" : "Copy Link"}
            </motion.button>
          </div>
          {stats.referralCount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xs sm:text-base mt-3 sm:mt-4 text-gray-600 dark:text-gray-400 font-medium"
              data-oid="w71gwcu"
            >
              🎉 {stats.referralCount} friend
              {stats.referralCount !== 1 ? "s" : ""} referred!
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
