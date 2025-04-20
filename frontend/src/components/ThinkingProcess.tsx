import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../app/search/shimmer.module.css";

// Define types for thinking steps
export interface ThinkingStep {
  name: string;
  status: "started" | "completed" | "error";
  data?: any;
}

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
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="content" // Add key for AnimatePresence
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          custom={delay} // Pass delay to variants
          style={{ overflow: "hidden" }}
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
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  // Calculate the progress based on completed steps
  useEffect(() => {
    if (thinkingSteps.length === 0) {
      setProgressPercentage(0);
      return;
    }

    // Define the total number of possible steps
    const totalSteps = 5; // relevant_sections, traits, key_phrases, sql_query, search_execution

    // Count completed steps
    const completedSteps = thinkingSteps.filter(
      (step) => step.status === "completed"
    ).length;

    // Calculate progress percentage - include partial credit for started steps
    const startedSteps = thinkingSteps.filter(
      (step) => step.status === "started"
    ).length;
    const progress = ((completedSteps + startedSteps * 0.5) / totalSteps) * 100;

    setProgressPercentage(progress);
  }, [thinkingSteps]);

  // Get completed steps data
  const relevantSections =
    thinkingSteps.find(
      (step) => step.name === "relevant_sections" && step.status === "completed"
    )?.data || [];

  const traits =
    thinkingSteps.find(
      (step) => step.name === "traits" && step.status === "completed"
    )?.data || [];

  const keyPhrases =
    thinkingSteps.find(
      (step) => step.name === "key_phrases" && step.status === "completed"
    )?.data || [];

  const sqlQuery = thinkingSteps.find(
    (step) => step.name === "sql_query" && step.status === "completed"
  )?.data;

  // Check if a specific step is in progress
  const isRelevantSectionsLoading = thinkingSteps.some(
    (step) => step.name === "relevant_sections" && step.status === "started"
  );

  const isTraitsLoading = thinkingSteps.some(
    (step) => step.name === "traits" && step.status === "started"
  );

  const isKeyPhrasesLoading = thinkingSteps.some(
    (step) => step.name === "key_phrases" && step.status === "started"
  );

  const isSqlQueryLoading = thinkingSteps.some(
    (step) => step.name === "sql_query" && step.status === "started"
  );

  // Get the current active loading step (for display at bottom)
  const activeLoadingStep = thinkingSteps.find(
    (step) => step.status === "started"
  );

  // Check if any step has been started or completed for conditional rendering
  const hasRelevantSectionsStarted = thinkingSteps.some(
    (step) =>
      step.name === "relevant_sections" &&
      (step.status === "started" || step.status === "completed")
  );

  const hasTraitsStarted = thinkingSteps.some(
    (step) =>
      step.name === "traits" &&
      (step.status === "started" || step.status === "completed")
  );

  const hasKeyPhrasesStarted = thinkingSteps.some(
    (step) =>
      step.name === "key_phrases" &&
      (step.status === "started" || step.status === "completed")
  );

  const hasSqlQueryStarted = thinkingSteps.some(
    (step) =>
      step.name === "sql_query" &&
      (step.status === "started" || step.status === "completed")
  );

  const hasSearchExecutionStarted = thinkingSteps.some(
    (step) =>
      step.name === "search_execution" &&
      (step.status === "started" || step.status === "completed")
  );

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
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm relative">
      {/* Header with toggle - entire header is now clickable */}
      <button
        onClick={() => setShowThinking(!showThinking)}
        className="flex items-center justify-between w-full mb-4 focus:outline-none text-left"
        aria-expanded={showThinking}
      >
        <div className="flex justify-center">
          <svg
            className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {activeLoadingStep ? (
              <span
                className={styles["shimmer-text"] + "animate-pulse font-light"}
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
        >
          <path d="M19 9l-7 7-7-7"></path>
        </motion.svg>
      </button>

      <AnimatePresence mode="wait">
        {!showThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center text-gray-500 dark:text-gray-400 text-xs mt-2"
          >
            (Thinking process hidden)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container with animation */}
      <AnimatePresence>
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
            />

            {/* Add padding to content to make room for progress bar */}
            <div className="pl-6">
              {/* Filters Section - Use AnimatedSection */}
              <AnimatedSection
                isVisible={hasRelevantSectionsStarted}
                delay={100}
              >
                <div className="mb-4">
                  <div className="flex mb-2">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    <h3 className="font-medium text-gray-700 dark:text-gray-200">
                      Identified Relevant Sections
                    </h3>
                    {isRelevantSectionsLoading && (
                      <div className="ml-2 items-center animate-pulse">
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6 space-y-2">
                    {isRelevantSectionsLoading ? (
                      // Skeleton loading for dynamic sections
                      <>
                        <div className="flex items-center space-x-2 animate-pulse mb-1">
                          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded flex-shrink-0"></div>
                          <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                        <div className="flex items-center space-x-2 animate-pulse">
                          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded flex-shrink-0"></div>
                          <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </>
                    ) : // Display the dynamic sections
                    relevantSections.length > 0 ? (
                      relevantSections.map((section: string) => (
                        <div
                          key={section}
                          className="flex items-center space-x-2"
                        >
                          {/* Generic icon, can be enhanced later */}
                          <svg
                            className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" // Checkmark circle icon
                            />
                          </svg>
                          <span className="text-gray-800 dark:text-gray-200">
                            {/* Format section name */}
                            {section
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">
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
              >
                <div className="mb-4">
                  <div className="flex mb-2">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <h3 className="font-medium text-gray-700 dark:text-gray-200">
                      Traits
                    </h3>
                    {isTraitsLoading && (
                      <div className="ml-2 items-center animate-pulse">
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6">
                    <div className="flex flex-wrap">
                      {isTraitsLoading ? (
                        // Skeleton loading for traits
                        <>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-16 rounded mr-2 mb-2 animate-pulse"></div>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-24 rounded mr-2 mb-2 animate-pulse"></div>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-20 rounded mr-2 mb-2 animate-pulse"></div>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-28 rounded mr-2 mb-2 animate-pulse"></div>
                        </>
                      ) : (
                        traits.map((trait: string) => (
                          <span
                            key={trait}
                            className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded mr-2 mb-2"
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
              >
                <div className="mb-4">
                  <div className="flex mb-2">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <h3 className="font-medium text-gray-700 dark:text-gray-200">
                      Key phrases
                    </h3>
                    {isKeyPhrasesLoading && (
                      <div className="ml-2 items-center animate-pulse">
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6">
                    <div className="flex flex-wrap">
                      {isKeyPhrasesLoading ? (
                        // Skeleton loading for key phrases
                        <>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-32 rounded mr-2 mb-2 animate-pulse"></div>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-40 rounded mr-2 mb-2 animate-pulse"></div>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-36 rounded mr-2 mb-2 animate-pulse"></div>
                          <div className="inline-block bg-gray-300 dark:bg-gray-600 h-6 w-28 rounded mr-2 mb-2 animate-pulse"></div>
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
                            >
                              {phrase.key_phrase}
                            </span>
                          )
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
              >
                <div className="mb-4">
                  <div className="flex mb-2">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                    <h3 className="font-medium text-gray-700 dark:text-gray-200">
                      SQL query
                    </h3>
                    {isSqlQueryLoading && (
                      <div className="ml-2 items-center animate-pulse">
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="pl-6">
                    {isSqlQueryLoading ? (
                      // Skeleton loading for SQL query
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-11/12 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                      </div>
                    ) : (
                      sqlQuery && (
                        <pre className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {sqlQuery}
                        </pre>
                      )
                    )}
                  </div>
                </div>
              </AnimatedSection>

              {/* Active loading step indicator */}
              {activeLoadingStep && (
                <div className="mt-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
                    <span>
                      Processing:{" "}
                      {activeLoadingStep.name
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
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
                  step.status === "completed"
              ) && (
                <div className="mt-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>
                      Found{" "}
                      {thinkingSteps.find(
                        (step) =>
                          step.name === "search_execution" &&
                          step.status === "completed"
                      )?.data?.count || 0}{" "}
                      results
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
