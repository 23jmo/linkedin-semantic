"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme-context";

export default function EmailGenerator() {
  const [recipientName, setRecipientName] = useState("");
  const [recipientRole, setRecipientRole] = useState("");
  const [purpose, setPurpose] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const { resolvedTheme } = useTheme();

  const handleGenerate = async () => {
    if (!recipientName || !purpose) {
      setError("Recipient name and purpose are required");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientName,
          recipientRole,
          purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate email");
      }

      setGeneratedEmail(data.emailContent);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to generate email",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg ${
        resolvedTheme === "dark" ? "bg-gray-800" : "bg-white"
      } shadow`}
    >
      <h2
        className={`text-xl font-semibold mb-4 ${
          resolvedTheme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        Email Generator
      </h2>

      <div className="space-y-4 mb-4">
        <div>
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="recipientName"
          >
            Recipient Name
          </label>
          <input
            id="recipientName"
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className={`w-full p-2 border rounded ${
              resolvedTheme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            placeholder="John Doe"
          />
        </div>

        <div>
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="recipientRole"
          >
            Recipient Role (optional)
          </label>
          <input
            id="recipientRole"
            type="text"
            value={recipientRole}
            onChange={(e) => setRecipientRole(e.target.value)}
            className={`w-full p-2 border rounded ${
              resolvedTheme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            placeholder="Software Engineer"
          />
        </div>

        <div>
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="purpose"
          >
            Email Purpose
          </label>
          <textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className={`w-full p-2 border rounded ${
              resolvedTheme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            rows={3}
            placeholder="Introduce yourself and ask about job opportunities"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`px-4 py-2 rounded ${
            isGenerating ? "opacity-70 cursor-not-allowed" : ""
          } ${
            resolvedTheme === "dark"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isGenerating ? "Generating..." : "Generate Email"}
        </button>
      </div>

      {generatedEmail && (
        <div>
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="generatedEmail"
          >
            Generated Email
          </label>
          <textarea
            id="generatedEmail"
            value={generatedEmail}
            onChange={(e) => setGeneratedEmail(e.target.value)}
            className={`w-full p-2 border rounded ${
              resolvedTheme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            rows={10}
            readOnly={false}
          />
        </div>
      )}
    </div>
  );
}
