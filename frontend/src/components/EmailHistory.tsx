"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";

type EmailHistoryItem = {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  content: string;
  sent_at: string;
};

export default function EmailHistory() {
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  // States for expandable features
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [isContainerExpanded, setIsContainerExpanded] = useState(false);

  // Toggle email expansion
  const toggleEmail = (id: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  useEffect(() => {
    async function fetchEmailHistory() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/email/history");

        if (!response.ok) {
          throw new Error("Failed to fetch email history");
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching email history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmailHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-red-500">
        Error loading email history: {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p
        className={`${
          resolvedTheme === "dark" ? "text-gray-300" : "text-gray-500"
        }`}
      >
        You haven&apos;t sent any emails yet.
      </p>
    );
  }

  return (
    <div>
      <div
        className={`space-y-4 overflow-hidden transition-all duration-300 ${
          isContainerExpanded ? "" : "max-h-96"
        }`}
      >
        {history.map((item) => {
          const isExpanded = expandedEmails.has(item.id);

          return (
            <div
              key={item.id}
              className={`${
                resolvedTheme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              } border rounded-lg p-4`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">
                    {isExpanded || item.subject.length <= 50
                      ? item.subject
                      : `${item.subject.substring(0, 50)}...`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    To: {item.recipient_name} ({item.recipient_email})
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.sent_at).toLocaleString()}
                </span>
              </div>
              <div
                className={`text-sm mt-2 ${
                  resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {isExpanded
                  ? item.content
                  : item.content.length > 150
                    ? `${item.content.substring(0, 150)}...`
                    : item.content}
              </div>
              {item.content.length > 150 && (
                <button
                  onClick={() => toggleEmail(item.id)}
                  className={`text-xs mt-2 ${
                    resolvedTheme === "dark"
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {history.length > 3 && (
        <div className="text-center mt-4">
          <button
            onClick={() => setIsContainerExpanded(!isContainerExpanded)}
            className={`text-sm px-4 py-2 rounded-md ${
              resolvedTheme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            {isContainerExpanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </div>
  );
}
