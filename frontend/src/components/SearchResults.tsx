import { useState, useEffect, useRef } from "react";
import { ProfileFrontend, TraitScore } from "../types/types";
import { SearchResult } from "../types/types";
import ProfileCard from "./ProfileCard";
import { FaLinkedin, FaCheck } from "react-icons/fa";
import Image from "next/image";
import ProfileImage from "./ProfileImage";
import { useTheme } from "@/lib/theme-context";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  selectedProfiles: ProfileFrontend[];
  onProfileSelect: (profile: ProfileFrontend, selected: boolean) => void;
}

// TraitScoreCircle Component
function TraitScoreCircle({ traitScores }: { traitScores?: TraitScore[] }) {
  if (!traitScores || traitScores.length === 0) {
    return (
      <span className="text-xs italic text-gray-400">No trait scores</span>
    );
  }

  const size = 40; // Size of the circle in pixels
  const radius = size / 2;
  const center = { x: radius, y: radius };
  const innerRadius = radius * 0.6; // Inner radius for hollow effect
  const scoreColors = {
    Yes: "#10b981", // Green
    "Kind Of": "#f59e0b", // Yellow
    No: "#ef4444", // Red
  };

  // Generate pie slices
  const slices = traitScores.map((score, index) => {
    const total = traitScores.length;
    const startAngle = (index / total) * 2 * Math.PI;
    const endAngle = ((index + 1) / total) * 2 * Math.PI;

    // Calculate outer arc
    const outerX1 = center.x + radius * Math.sin(startAngle);
    const outerY1 = center.y - radius * Math.cos(startAngle);
    const outerX2 = center.x + radius * Math.sin(endAngle);
    const outerY2 = center.y - radius * Math.cos(endAngle);

    // Calculate inner arc
    const innerX1 = center.x + innerRadius * Math.sin(endAngle);
    const innerY1 = center.y - innerRadius * Math.cos(endAngle);
    const innerX2 = center.x + innerRadius * Math.sin(startAngle);
    const innerY2 = center.y - innerRadius * Math.cos(startAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    // SVG path for a hollow slice
    const path = `
      M ${outerX1},${outerY1}
      A ${radius},${radius} 0 ${largeArcFlag} 1 ${outerX2},${outerY2}
      L ${innerX1},${innerY1}
      A ${innerRadius},${innerRadius} 0 ${largeArcFlag} 0 ${innerX2},${innerY2}
      Z
    `;

    return {
      path,
      fill: scoreColors[score.score as keyof typeof scoreColors],
      score,
    };
  });

  return (
    <div className="relative group">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="inline-block"
      >
        {slices.map((slice, index) => (
          <path
            key={index}
            d={slice.path}
            fill={slice.fill}
            stroke="#fff"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Tooltip showing trait scores on hover */}
      <div className="absolute left-full ml-2 top-0 z-10 hidden group-hover:block bg-white dark:bg-gray-800 shadow-lg rounded p-2 w-64">
        <p className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Trait Scores:
        </p>
        <ul className="space-y-1">
          {traitScores.map((trait, index) => (
            <li
              key={index}
              className="text-xs"
            >
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{
                  backgroundColor:
                    scoreColors[trait.score as keyof typeof scoreColors],
                }}
              ></span>
              <strong>{trait.trait}:</strong> {trait.score}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// TraitEvidence Component
function TraitEvidence({ traitScores }: { traitScores?: TraitScore[] }) {
  if (!traitScores || traitScores.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
      {traitScores.map(
        (trait, index) =>
          trait.evidence && (
            <div
              key={index}
              className="mb-1"
            >
              <span className="font-medium">{trait.trait}:</span>{" "}
              {trait.evidence}
            </div>
          )
      )}
    </div>
  );
}

export default function SearchResults({
  results,
  query,
  selectedProfiles,
  onProfileSelect,
}: SearchResultsProps) {
  // Use theme context for dark/light mode
  const { resolvedTheme } = useTheme();

  // State for hover preview
  const [hoveredProfile, setHoveredProfile] = useState<ProfileFrontend | null>(
    null
  );
  const [previewPosition, setPreviewPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // State to track the hover timeout
  const [hoverTimeoutId, setHoverTimeoutId] = useState<number | null>(null);

  // State for detail modal
  const [selectedProfileForDetail, setSelectedProfileForDetail] =
    useState<ProfileFrontend | null>(null);

  // Handle row hover
  const handleRowHover = (profile: ProfileFrontend, e: React.MouseEvent) => {
    // Clear any existing timeout
    if (hoverTimeoutId !== null) {
      window.clearTimeout(hoverTimeoutId);
    }

    // Set a new timeout for 1 second delay
    const timeoutId = window.setTimeout(() => {
      setHoveredProfile(profile);
      // Position the preview at the mouse position, slightly offset
      setPreviewPosition({ x: e.clientX + 20, y: e.clientY - 40 });
    }, 1000);

    // Save the timeout ID
    setHoverTimeoutId(timeoutId);
  };

  // Handle row hover end
  const handleRowHoverEnd = () => {
    // Clear the timeout if it exists
    if (hoverTimeoutId !== null) {
      window.clearTimeout(hoverTimeoutId);
      setHoverTimeoutId(null);
    }

    setHoveredProfile(null);
    setPreviewPosition(null);
  };

  // Handle row click
  const handleRowClick = (profile: ProfileFrontend) => {
    setSelectedProfileForDetail(profile);
  };

  // Convert search result to ProfileFrontend
  const convertToProfileFrontend = (result: SearchResult): ProfileFrontend => {
    return {
      id: result.profile.id,
      user_id: result.profile.user_id,
      firstName: result.profile.full_name
        ? result.profile.full_name.split(" ")[0]
        : "Unknown",
      lastName: result.profile.full_name
        ? result.profile.full_name.split(" ").slice(1).join(" ")
        : "",
      headline: result.profile.headline,
      summary: result.profile.summary,
      location: result.profile.location,
      industry: result.profile.industry,
      profileUrl: result.profile.profile_url || "",
      profilePicture: result.profile.profile_picture_url,
      highlights: result.highlights,
      raw_profile_data: result.profile.raw_profile_data,
    };
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedProfileForDetail) {
        setSelectedProfileForDetail(null);
      }
    };

    // Add event listener for escape key
    document.addEventListener("keydown", handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [selectedProfileForDetail]);

  // Handle click outside
  const modalRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close modal if clicking on backdrop (not on the modal content)
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setSelectedProfileForDetail(null);
    }
  };

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          No results found for &quot;{query}&quot;
        </p>
        <p className="text-gray-500 dark:text-gray-500">
          Try a different search term or broaden your query
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              scope="col"
              className="w-12 px-3 py-3 text-left"
            >
              <span className="sr-only">Select</span>
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Score
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Relevant Info
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Previous Emails
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              LinkedIn
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {results.map((result) => {
            const profile = convertToProfileFrontend(result);
            const isSelected = selectedProfiles.some(
              (p) => p.id === profile.id
            );

            return (
              <tr
                key={profile.id}
                className={`${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                } cursor-pointer transition-colors duration-150 ease-in-out`}
                onMouseEnter={(e) => handleRowHover(profile, e)}
                onMouseLeave={handleRowHoverEnd}
                onClick={() => handleRowClick(profile)}
              >
                <td className="px-3 py-4 whitespace-nowrap">
                  <div
                    className="flex items-center h-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={isSelected}
                      onChange={(e) =>
                        onProfileSelect(profile, e.target.checked)
                      }
                    />
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {result.trait_scores && (
                      <TraitScoreCircle traitScores={result.trait_scores} />
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <ProfileImage
                        imageUrl={profile.profilePicture}
                        firstName={profile.firstName}
                        lastName={profile.lastName}
                        size="sm"
                      />
                    </div>
                    <div className="ml-4 max-w-[12rem] relative">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-full">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-full">
                        {profile.headline || "LinkedIn Member"}
                      </div>
                      {/* Add fade effect for long text */}
                      {profile.firstName.length + profile.lastName.length >
                        30 && (
                        <div
                          className="absolute top-0 right-0 h-full w-12 pointer-events-none"
                          style={{
                            background:
                              resolvedTheme === "dark"
                                ? "linear-gradient(to right, rgba(17,24,39,0), rgba(17,24,39,1))"
                                : "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1))",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {result.trait_scores ? (
                      <div>
                        <ul className="list-disc pl-4 space-y-1">
                          {result.trait_scores.map((t, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-700 dark:text-gray-300 break-words"
                            >
                              <span className="font-semibold">{t.trait}:</span>{" "}
                              {t.score}
                              {t.evidence && (
                                <span className="block text-xs italic text-gray-500 dark:text-gray-400 mt-0.5 ml-2">
                                  {t.evidence}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        No trait scores available
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {/* Placeholder for previous emails */}
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                      Not implemented yet
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {profile.profileUrl ? (
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <FaLinkedin className="inline mr-1" />
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                      No link
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Profile Preview on Hover */}
      {hoveredProfile && previewPosition && (
        <div
          className="absolute z-20 shadow-lg rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 max-w-md"
          style={{
            top: `${previewPosition.y}px`,
            left: `${previewPosition.x}px`,
            maxWidth: "320px",
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <ProfileImage
                imageUrl={hoveredProfile.profilePicture}
                firstName={hoveredProfile.firstName}
                lastName={hoveredProfile.lastName}
                size="md"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {hoveredProfile.firstName} {hoveredProfile.lastName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {hoveredProfile.headline}
              </p>
              {hoveredProfile.summary && (
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
                  {hoveredProfile.summary}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                Hover for preview, click for details
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedProfileForDetail && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center overflow-auto"
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto p-6 m-4 w-full"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Profile Details
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setSelectedProfileForDetail(null)}
              >
                &times;
              </button>
            </div>
            <div>
              <ProfileCard
                profile={selectedProfileForDetail}
                selectable={false}
                initialExpanded={true} // Auto-expand the profile card
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
