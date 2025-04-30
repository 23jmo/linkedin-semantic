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
    async function fetchStats() {
      if (session?.user?.id) {
        try {
          console.log(
            "[ReferralPopup] Fetching referral stats for user:",
            session.user.id
          );
          const res = await fetch("/api/referrals/stats");
          if (res.ok) {
            const data = await res.json();
            console.log("[ReferralPopup] Received stats:", data);
            setStats(data);
          } else {
            console.error(
              "[ReferralPopup] Failed to fetch referral stats:",
              res.status
            );
            try {
              const errorData = await res.json();
              console.error("[ReferralPopup] Error details:", errorData);
            } catch (e) {
              // Ignore if we can't parse the error response
            }
          }
        } catch (error) {
          console.error(
            "[ReferralPopup] Error fetching referral stats:",
            error
          );
        }
      } else {
        console.log("[ReferralPopup] No user session, skipping stats fetch");
      }
    }
    fetchStats();
  }, [session?.user?.id]);

  useEffect(() => {
    // Check if popup was previously dismissed in this session
    let isDismissed = false;

    try {
      isDismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
      console.log(
        "[ReferralPopup] Session storage dismissed status:",
        isDismissed
      );
    } catch (error) {
      console.error("[ReferralPopup] Error accessing sessionStorage:", error);
      // Fall back to showing the popup if we can't access sessionStorage
    }

    if (isDismissed) {
      console.log(
        "[ReferralPopup] Popup was previously dismissed, not showing"
      );
      return;
    }

    // Only show the popup if stats are loaded
    if (!stats) {
      console.log("[ReferralPopup] Stats not loaded yet, waiting");
      return;
    }

    console.log(
      "[ReferralPopup] Stats loaded, referralCount:",
      stats.referralCount,
      "referralCode:",
      stats.referralCode
    );

    // Show popup after 3 seconds if user hasn't referred anyone or has fewer than 10 referrals
    const timer = setTimeout(() => {
      // Show popup only if referralCount is 0-9 (less than 10)
      if (
        stats.referralCode &&
        (stats.referralCount === 0 ||
          (stats.referralCount > 0 && stats.referralCount < 10))
      ) {
        console.log(
          "[ReferralPopup] Showing popup with referral stats:",
          stats
        );
        setShowPopup(true);
      } else {
        console.log(
          "[ReferralPopup] Not showing popup, conditions not met:",
          stats
        );
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [stats]);

  const handleDismiss = () => {
    setShowPopup(false);

    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch (error) {
      console.error("Error setting sessionStorage:", error);
      // Continue even if we can't set the sessionStorage item
    }
  };

  if (!stats?.referralCode) return null;

  const referralLink = `${window.location.origin}/?ref=${stats.referralCode}`;

  return (
    <AnimatePresence>
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
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDismiss}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 text-lg sm:text-xl"
          >
            ×
          </motion.button>
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-blue-600 dark:text-blue-400"
          >
            Share with Friends! 👋
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed"
          >
            Share your referral link and get{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              +10 monthly emails
            </span>{" "}
            for each friend who joins!
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <motion.input
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 p-2 sm:p-3 text-xs sm:text-base border rounded-lg bg-gray-50 dark:bg-gray-700"
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
