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
    <AnimatePresence initial={false} data-oid="tsy858g">
      {isVisible && (
        <motion.div
          key="content" // Add key for AnimatePresence
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          custom={delay} // Pass delay to variants
          style={{ overflow: "hidden" }}
          data-oid="vi4vm:r"
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
      data-oid="dnv5ny9"
    >
      {/* Header with toggle - entire header is now clickable */}
      <button
        onClick={() => setShowThinking(!showThinking)}
        className="flex items-center justify-between w-full mb-4 focus:outline-none text-left"
        aria-expanded={showThinking}
        data-oid="5fm.sp9"
      >
        <div className="flex justify-center" data-oid="mfaf_q5">
          <svg
            className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            data-oid="jrqmh6s"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
              data-oid="0qei4.g"
            />
          </svg>
          <h2
            className="text-lg font-semibold text-gray-700 dark:text-gray-200"
            data-oid="hb.fejr"
          >
            {activeLoadingStep ? (
              <span
                className={styles["shimmer-text"] + "animate-pulse font-light"}
                data-oid="hxvf80q"
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
          data-oid="6r:mcjr"
        >
          <path d="M19 9l-7 7-7-7" data-oid="0ll.bld"></path>
        </motion.svg>
      </button>

      <AnimatePresence mode="wait" data-oid="qixog57">
        {!showThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center text-gray-500 dark:text-gray-400 text-xs mt-2"
            data-oid="thcrnas"
          >
            (Thinking process hidden)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container with animation */}
      <AnimatePresence data-oid="5mjvrna">
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
            data-oid="mb..mfp"
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
              data-oid="02zqvu9"
            />

            {/* Add padding to content to make room for progress bar */}
            <div className="pl-6" data-oid=".bh1n-4">
              {/* Filters Section - Use AnimatedSection */}
              <AnimatedSection
                isVisible={hasRelevantSectionsStarted}
                delay={100}
                data-oid="t1l6xza"
              >
                <div className="mb-4" data-oid="du4l2w3">
                  <div className="flex mb-2" data-oid="mbgq2si">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="yol:xl4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        data-oid="vlycnj1"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="lnudkfl"
                    >
                      Identified Relevant Sections
                    </h3>
                    {isRelevantSectionsLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="rx.1:f_"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="_d3xcig"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6 space-y-2" data-oid="f7pbea7">
                    {isRelevantSectionsLoading ? (
                      // Skeleton loading for dynamic sections
                      <>
                        <div
                          className="flex items-center space-x-2 animate-pulse mb-1"
                          data-oid="0gm09ye"
                        >
                          <div
                            className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded flex-shrink-0"
                            data-oid="9fo6h7o"
                          ></div>
                          <div
                            className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded"
                            data-oid="t5erwip"
                          ></div>
                        </div>
                        <div
                          className="flex items-center space-x-2 animate-pulse"
                          data-oid="8quq6--"
                        >
                          <div
                            className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded flex-shrink-0"
                            data-oid="p_ru_07"
                          ></div>
                          <div
                            className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded"
                            data-oid="7asm.-o"
                          ></div>
                        </div>
                      </>
                    ) : // Display the dynamic sections
                    relevantSections.length > 0 ? (
                      relevantSections.map((section: string) => (
                        <div
                          key={section}
                          className="flex items-center space-x-2"
                          data-oid="8ur334a"
                        >
                          {/* Generic icon, can be enhanced later */}
                          <svg
                            className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            data-oid="b05ahpv"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" // Checkmark circle icon
                              data-oid="ib.lmzq"
                            />
                          </svg>
                          <span
                            className="text-gray-800 dark:text-gray-200"
                            data-oid="-lf17ep"
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
                        data-oid="f5xneyl"
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
                data-oid="w84i:oy"
              >
                <div className="mb-4" data-oid="21xavez">
                  <div className="flex mb-2" data-oid="r1f25g-">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="m8cj7_e"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        data-oid="pf.0yd6"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="viy_-kh"
                    >
                      Traits
                    </h3>
                    {isTraitsLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="mhm2bcz"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="jpiakoo"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6" data-oid=":birl2i">
                    <div className="flex flex-wrap" data-oid="qqs55cc">
                      {isTraitsLoading ? (
                        // Skeleton loading for traits
                        <>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-16 rounded mr-2 mb-2 animate-pulse"
                            data-oid="o.fggy3"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-24 rounded mr-2 mb-2 animate-pulse"
                            data-oid="erd6-2z"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-20 rounded mr-2 mb-2 animate-pulse"
                            data-oid="isu3uzh"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-28 rounded mr-2 mb-2 animate-pulse"
                            data-oid="y80xb:i"
                          ></div>
                        </>
                      ) : (
                        traits.map((trait: string) => (
                          <span
                            key={trait}
                            className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded mr-2 mb-2"
                            data-oid="wirioe9"
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
                data-oid="zfmubts"
              >
                <div className="mb-4" data-oid="p7luyov">
                  <div className="flex mb-2" data-oid="pol4_s-">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="n7vgs6n"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                        data-oid="hx1k07s"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="d5x0z-u"
                    >
                      Key phrases
                    </h3>
                    {isKeyPhrasesLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="ro2s3a8"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="p0inwm5"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6" data-oid="f02krzi">
                    <div className="flex flex-wrap" data-oid="1hohnrr">
                      {isKeyPhrasesLoading ? (
                        // Skeleton loading for key phrases
                        <>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-32 rounded mr-2 mb-2 animate-pulse"
                            data-oid="3g0nwf_"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-40 rounded mr-2 mb-2 animate-pulse"
                            data-oid="7py9xg7"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-36 rounded mr-2 mb-2 animate-pulse"
                            data-oid="i7o2.-r"
                          ></div>
                          <div
                            className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-28 rounded mr-2 mb-2 animate-pulse"
                            data-oid="e0-r-gi"
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
                              data-oid="0d27f2c"
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
                data-oid="--t1ooe"
              >
                <div className="mb-4" data-oid="o4qg96e">
                  <div className="flex mb-2" data-oid="h7fabff">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="37k14pm"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                        data-oid="dkdqtov"
                      />
                    </svg>
                    <h3
                      className="font-medium text-gray-700 dark:text-gray-200"
                      data-oid="d-o1k0d"
                    >
                      SQL query
                    </h3>
                    {isSqlQueryLoading && (
                      <div
                        className="ml-2 items-center animate-pulse"
                        data-oid="49nwbgf"
                      >
                        <div
                          className="h-2 w-2 bg-blue-400 rounded-full"
                          data-oid="u8-v_t1"
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6" data-oid="3rfw-2f">
                    {isSqlQueryLoading ? (
                      // Skeleton loading for SQL query
                      <div className="animate-pulse" data-oid="6fga2qr">
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"
                          data-oid="bzq_s3w"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-2"
                          data-oid=".lxksjd"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-11/12 mb-2"
                          data-oid=":f0.1l1"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mb-2"
                          data-oid="di-o4gh"
                        ></div>
                        <div
                          className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"
                          data-oid="18tz_8a"
                        ></div>
                      </div>
                    ) : (
                      sqlQuery && (
                        <pre
                          className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap"
                          data-oid="jhpn9h9"
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
                  data-oid="_jzwnzt"
                >
                  <div
                    className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    data-oid="hnsu2wy"
                  >
                    <div
                      className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"
                      data-oid="1sgy6y0"
                    ></div>
                    <span data-oid="g7yh0et">
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
                  data-oid="xr5x65v"
                >
                  <div
                    className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    data-oid="yq.3t9_"
                  >
                    <svg
                      className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="b6:qkj-"
                    >
                      <path d="M5 13l4 4L19 7" data-oid="2wf3bxf"></path>
                    </svg>
                    <span data-oid="fjinbd8">
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
