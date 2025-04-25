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
      data-oid="c2icdwq"
    >
      <h2
        className={`text-xl font-semibold mb-4 ${
          resolvedTheme === "dark" ? "text-white" : "text-gray-800"
        }`}
        data-oid="9m7y-8i"
      >
        Email Generator
      </h2>

      <div className="space-y-4 mb-4" data-oid="vzg.spr">
        <div data-oid="bhwfc97">
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="recipientName"
            data-oid="_oqn3dn"
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
            data-oid="i:mez_4"
          />
        </div>

        <div data-oid="zslc.a:">
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="recipientRole"
            data-oid="zjl:9ql"
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
            data-oid="04s6.tx"
          />
        </div>

        <div data-oid="8-1:47a">
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="purpose"
            data-oid=":8hu3y3"
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
            data-oid="non045."
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm" data-oid="a38-d9o">
            {error}
          </div>
        )}

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
          data-oid=":kmh2ia"
        >
          {isGenerating ? "Generating..." : "Generate Email"}
        </button>
      </div>

      {generatedEmail && (
        <div data-oid="eo2b_69">
          <label
            className={`block mb-1 ${
              resolvedTheme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
            htmlFor="generatedEmail"
            data-oid="vxmm8gc"
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
            data-oid="wyfkr7v"
          />
        </div>
      )}
    </div>
  );
}
