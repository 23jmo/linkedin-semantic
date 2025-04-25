import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../app/search/shimmer.module.css";

// Define types for thinking steps
export interface ThinkingStep {
  name: string;
  status: "started" | "completed" | "error";
  data?: unknown;
}

// --- Add KeyPhrase interface definition ---
interface KeyPhrase {
  key_phrase: string;
  relevant_section: string;
}
// --- End KeyPhrase definition ---

interface ThinkingProcessProps {
  thinkingSteps: ThinkingStep[];
  initialShowThinking?: boolean;
}

// Use Framer Motion for AnimatedSection
const sectionVariants = {
  hidden: { opacity: 0, height: 0, y: -10 },
  visible: (delay = 0) => ({
    opacity: 1,
    height: "auto",
    y: 0,
    transition: {
      delay: delay * 0.001, // Convert ms delay to seconds
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  }),
  exit: {
    opacity: 0,
    height: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  },
};

const AnimatedSection = ({
  isVisible,
  children,
  delay = 0,
}: {
  isVisible: boolean;
  children: React.ReactNode;
  delay?: number;
}) => {
  // We don't need useTransition or useSpring anymore
  return (
    <AnimatePresence initial={false} data-oid="n3v-.sp">
      {isVisible && (
        <motion.div
          key="content" // Add key for AnimatePresence
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          custom={delay} // Pass delay to variants
          style={{ overflow: "hidden" }}
          data-oid="vcdejtq"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function ThinkingProcess({
  thinkingSteps,
  initialShowThinking = true,
}: ThinkingProcessProps) {
  const [showThinking, setShowThinking] =
    useState<boolean>(initialShowThinking);
  // const [progressPercentage, setProgressPercentage] = useState<number>(0);

  // Calculate the progress based on completed steps
  useEffect(() => {
    if (thinkingSteps.length === 0) {
      // setProgressPercentage(0);
      return;
    }

    // Define the total number of possible steps
    // const totalSteps = 5; // relevant_sections, traits, key_phrases, sql_query, search_execution

    // // Count completed steps
    // const completedSteps = thinkingSteps.filter(
    //   (step) => step.status === "completed"
    // ).length;

    // // Calculate progress percentage - include partial credit for started steps
    // const startedSteps = thinkingSteps.filter(
    //   (step) => step.status === "started"
    // ).length;
    // // const progress = ((completedSteps + startedSteps * 0.5) / totalSteps) * 100;

    // setProgressPercentage(progress);
  }, [thinkingSteps]);

  // --- Get completed steps data with type safety ---
  const relevantSectionsData = thinkingSteps.find(
    (step) => step.name === "relevant_sections" && step.status === "completed",
  )?.data;
  const relevantSections = Array.isArray(relevantSectionsData)
    ? (relevantSectionsData as string[])
    : [];

  const traitsData = thinkingSteps.find(
    (step) => step.name === "traits" && step.status === "completed",
  )?.data;
  const traits = Array.isArray(traitsData) ? (traitsData as string[]) : [];

  // Assuming KeyPhrase is imported or defined
  const keyPhrasesData = thinkingSteps.find(
    (step) => step.name === "key_phrases" && step.status === "completed",
  )?.data;
  const keyPhrases = Array.isArray(keyPhrasesData)
    ? (keyPhrasesData as KeyPhrase[])
    : [];

  const sqlQueryData = thinkingSteps.find(
    (step) => step.name === "sql_query" && step.status === "completed",
  )?.data;
  // Ensure sqlQuery is a string for rendering
  const sqlQuery = typeof sqlQueryData === "string" ? sqlQueryData : "";

  const searchExecutionData = thinkingSteps.find(
    (step) => step.name === "search_execution" && step.status === "completed",
  )?.data;
  // Safely access count property
  const searchCount =
    typeof searchExecutionData === "object" &&
    searchExecutionData !== null &&
    "count" in searchExecutionData &&
    typeof searchExecutionData.count === "number"
      ? searchExecutionData.count
      : 0;
  // --- End type-safe data extraction ---

  // Check if a specific step is in progress
  const isRelevantSectionsLoading = thinkingSteps.some(
    (step) => step.name === "relevant_sections" && step.status === "started",
  );

  const isTraitsLoading = thinkingSteps.some(
    (step) => step.name === "traits" && step.status === "started",
  );

  const isKeyPhrasesLoading = thinkingSteps.some(
    (step) => step.name === "key_phrases" && step.status === "started",
  );

  const isSqlQueryLoading = thinkingSteps.some(
    (step) => step.name === "sql_query" && step.status === "started",
  );

  // Get the current active loading step (for display at bottom)
  const activeLoadingStep = thinkingSteps.find(
    (step) => step.status === "started",
  );

  // Check if any step has been started or completed for conditional rendering
  const hasRelevantSectionsStarted = thinkingSteps.some(
    (step) =>
      step.name === "relevant_sections" &&
      (step.status === "started" || step.status === "completed"),
  );

  const hasTraitsStarted = thinkingSteps.some(
    (step) =>
      step.name === "traits" &&
      (step.status === "started" || step.status === "completed"),
  );

  const hasKeyPhrasesStarted = thinkingSteps.some(
    (step) =>
      step.name === "key_phrases" &&
      (step.status === "started" || step.status === "completed"),
  );

  const hasSqlQueryStarted = thinkingSteps.some(
    (step) =>
      step.name === "sql_query" &&
      (step.status === "started" || step.status === "completed"),
  );

  // const hasSearchExecutionStarted = thinkingSteps.some(
  //   (step) =>
  //     step.name === "search_execution" &&
  //     (step.status === "started" || step.status === "completed")
  // );

  const getLoadingText = () => {
    if (!activeLoadingStep) return "Thinking process";

    // Format the step name for display by replacing underscores with spaces and capitalizing
    const formattedName = activeLoadingStep.name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return `Identifying ${formattedName}...`;
  };

  return (
    <div
      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm relative"
      data-oid="ow7go4b"
    >
      {/* Header with toggle - entire header is now clickable */}
      <button
        onClick={() => setShowThinking(!showThinking)}
        className="flex items-center justify-between w-full mb-4 focus:outline-none text-left"
        aria-expanded={showThinking}
        data-oid="sy6hxi_"
      >
        <div className="flex justify-center" data-oid="xlay0dt">
          <svg
            className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            data-oid="bnrd.y_"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
              data-oid="d53dzub"
            />
          </svg>
          <h2
            className="text-lg font-semibold text-gray-700 dark:text-gray-200"
            data-oid="q3zs3um"
          >
            {activeLoadingStep ? (
              <span
                className={styles["shimmer-text"] + "animate-pulse font-light"}
                data-oid="lmx57kx"
              >
                {getLoadingText()}
              </span>
            ) : showThinking ? (
              "Thinking process"
            ) : (
              "Show thinking"
            )}
          </h2>
        </div>
        <motion.svg
          animate={{ rotate: showThinking ? 180 : 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="h-5 w-5 text-gray-600 dark:text-gray-300 flex-shrink-0"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          data-oid="dx2w8th"
        >
          <path d="M19 9l-7 7-7-7" data-oid="3lygr66"></path>
        </motion.svg>
      </button>

      <AnimatePresence mode="wait" data-oid="r5by4v4">
        {!showThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center text-gray-500 dark:text-gray-400 text-xs mt-2"
            data-oid="st.wg9i"
          >
            (Thinking process hidden)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container with animation */}
      <AnimatePresence data-oid="dp0z3lq">
        {showThinking && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1.0],
              opacity: { duration: 0.25 },
              height: { duration: 0.4 },
            }}
            className="overflow-hidden relative"
            data-oid="d2tpjn0"
          >
            {/* Animated Progress Bar - now with spring */}
            <motion.div
              className="absolute ml-2 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg opacity-70"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{
                type: "spring",
                stiffness: 200, // Adjust for desired springiness
                damping: 25, // Adjust for desired damping
                // duration is automatically calculated by the spring physics
              }}
              style={{ transformOrigin: "top" }}
              data-oid="k.:wg9d"
            />

            {/* Add padding to content to make room for progress bar */}
            <div className="pl-6" data-oid="yw.14s4">
              {/* Filters Section - Use AnimatedSection */}
              <AnimatedSection
                isVisible={hasRelevantSectionsStarted}
                delay={100}
                data-oid="b9nukw-"
              >
                <div className="mb-4" data-oid="b625w8_">
                  <div className="flex mb-2" data-oid="oa:_trz">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="w7_9.qh"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        data-oid="nthl5m9"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="z42985d"
                    >
                      Identified Relevant Sections
                    </h3>
                    {isRelevantSectionsLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="-k6hw-a"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="vz0wl.f"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6 space-y-2" data-oid="s:8.k5e">
                    {isRelevantSectionsLoading ? (
                      // Skeleton loading for dynamic sections
                      <>
                        <div
                          className="flex items-center space-x-2 animate-pulse mb-1"
                          data-oid="8_.x-mi"
                        >
                          <div
                            className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded flex-shrink-0"
                            data-oid="bhjs_lj"
                          ></div>
                          <div
                            className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded"
                            data-oid="f:fdl2h"
                          ></div>
                        </div>
                        <div
                          className="flex items-center space-x-2 animate-pulse"
                          data-oid="u5po89a"
                        >
                          <div
                            className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded flex-shrink-0"
                            data-oid="6fu6frx"
                          ></div>
                          <div
                            className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded"
                            data-oid="si7lxwg"
                          ></div>
                        </div>
                      </>
                    ) : // Display the dynamic sections
                    relevantSections.length > 0 ? (
                      relevantSections.map((section: string) => (
                        <div
                          key={section}
                          className="flex items-center space-x-2"
                          data-oid="li16fxf"
                        >
                          {/* Generic icon, can be enhanced later */}
                          <svg
                            className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            data-oid="gzwc-0b"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" // Checkmark circle icon
                              data-oid="behw6i."
                            />
                          </svg>
                          <span
                            className="text-gray-800 dark:text-gray-200"
                            data-oid="-535sig"
                          >
                            {/* Format section name */}
                            {section
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div
                        className="text-gray-500 dark:text-gray-400 italic"
                        data-oid="549r0gw"
                      >
                        No specific sections identified based on query.
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedSection>

              {/* Traits Section - Use AnimatedSection */}
              <AnimatedSection
                isVisible={hasTraitsStarted}
                delay={150}
                data-oid="x6t.x5m"
              >
                <div className="mb-4" data-oid="cg0fqp_">
                  <div className="flex mb-2" data-oid="28f4u81">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="6qmqqy."
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        data-oid="1.xt0ay"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="7cj8:61"
                    >
                      Traits
                    </h3>
                    {isTraitsLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="so6n43u"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="8_ad_wx"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6" data-oid="x:l-m7t">
                    <div className="flex flex-wrap" data-oid="yp2zlzl">
                      {isTraitsLoading ? (
                        // Skeleton loading for traits
                        <>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-16 rounded mr-2 mb-2 animate-pulse"
                            data-oid="alzner0"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-24 rounded mr-2 mb-2 animate-pulse"
                            data-oid="l_o8h5a"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-20 rounded mr-2 mb-2 animate-pulse"
                            data-oid="z2i-2i5"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-28 rounded mr-2 mb-2 animate-pulse"
                            data-oid="-1m7d4g"
                          ></div>
                        </>
                      ) : (
                        traits.map((trait: string) => (
                          <span
                            key={trait}
                            className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded mr-2 mb-2"
                            data-oid="m-7..jc"
                          >
                            {trait}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Key Phrases Section - Use AnimatedSection */}
              <AnimatedSection
                isVisible={hasKeyPhrasesStarted}
                delay={200}
                data-oid="6hqb0cy"
              >
                <div className="mb-4" data-oid="asil6eg">
                  <div className="flex mb-2" data-oid="y39ymb:">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="jjh_pha"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                        data-oid="t36tdi5"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="37ts24g"
                    >
                      Key phrases
                    </h3>
                    {isKeyPhrasesLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="8d:3ziu"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="mw6_eke"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6" data-oid="6ybstna">
                    <div className="flex flex-wrap" data-oid="wbpcgsl">
                      {isKeyPhrasesLoading ? (
                        // Skeleton loading for key phrases
                        <>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-32 rounded mr-2 mb-2 animate-pulse"
                            data-oid="9m-9:dc"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-40 rounded mr-2 mb-2 animate-pulse"
                            data-oid="2kx56uc"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-36 rounded mr-2 mb-2 animate-pulse"
                            data-oid="5cigcgu"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-28 rounded mr-2 mb-2 animate-pulse"
                            data-oid="wp9mijp"
                          ></div>
                        </>
                      ) : (
                        keyPhrases.map(
                          (phrase: {
                            key_phrase: string;
                            relevant_section: string;
                          }) => (
                            <span
                              key={phrase.key_phrase}
                              className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded mr-2 mb-2"
                              data-oid="24-x7ii"
                            >
                              {phrase.key_phrase}
                            </span>
                          ),
                        )
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* SQL Query Section - Use AnimatedSection */}
              <AnimatedSection
                isVisible={hasSqlQueryStarted}
                delay={250}
                data-oid="p6ewhrq"
              >
                <div className="mb-4" data-oid="f.bw:z8">
                  <div className="flex mb-2" data-oid="r6:-hej">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="13zoxqc"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                        data-oid="sjavy:6"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="2am82pn"
                    >
                      SQL query
                    </h3>
                    {isSqlQueryLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="4zceobq"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="didbbjs"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6" data-oid="p8co9-y">
                    {isSqlQueryLoading ? (
                      // Skeleton loading for SQL query
                      <div className="animate-pulse" data-oid="6s94b8d">
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"
                          data-oid="g8pgpv5"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-2"
                          data-oid="87gwj11"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-11/12 mb-2"
                          data-oid="a.0e8hn"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mb-2"
                          data-oid="h6mfhs6"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"
                          data-oid="0mm5s2t"
                        ></div>
                      </div>
                    ) : (
                      sqlQuery && (
                        <pre
                          className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap"
                          data-oid="mr9c2m6"
                        >
                          {sqlQuery}
                        </pre>
                      )
                    )}
                  </div>
                </div>
              </AnimatedSection>

              {/* Active loading step indicator */}
              {activeLoadingStep && (
                <div
                  className="mt-4 py-2 border-t border-gray-200 dark:border-gray-700"
                  data-oid="vmtsuys"
                >
                  <div
                    className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    data-oid="xjcumie"
                  >
                    <div
                      className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"
                      data-oid="epv5t9o"
                    ></div>
                    <span data-oid="mkfk7iw">
                      Processing:{" "}
                      {activeLoadingStep.name
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                      ...
                    </span>
                  </div>
                </div>
              )}

              {/* Search execution result - appears after search is done */}
              {thinkingSteps.some(
                (step) =>
                  step.name === "search_execution" &&
                  step.status === "completed",
              ) && (
                <div
                  className="mt-4 py-2 border-t border-gray-200 dark:border-gray-700"
                  data-oid=":ya6y35"
                >
                  <div
                    className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    data-oid="rsr:cfn"
                  >
                    <svg
                      className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="ncr2w3w"
                    >
                      <path d="M5 13l4 4L19 7" data-oid="940h1.m"></path>
                    </svg>
                    <span data-oid="-_89:k-">
                      Found {/* Use the safe searchCount variable */}
                      {searchCount} results
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
