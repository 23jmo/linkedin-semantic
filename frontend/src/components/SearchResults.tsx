import { useState, useEffect, useRef, useCallback } from "react";
import { ProfileFrontend, TraitScore } from "../types/types";
import { SearchResult } from "../types/types";
import ProfileCard from "./ProfileCard";
import { FaLinkedin } from "react-icons/fa";
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
      <span className="text-xs italic text-gray-400" data-oid="r1xe14s">
        No scores
      </span>
    );
  }

  const size = 40;
  const radius = size / 2;
  const center = { x: radius, y: radius };
  const innerRadius = radius * 0.6;
  const scoreColors = {
    Yes: "#8CBCFF",
    "Kind Of": "#f59e0b",
    No: "#ef4444",
  };
  const epsilon = 0.0001; // Small value to prevent exact zero/2*PI angles

  const slices = traitScores
    .map((score, index) => {
      const total = traitScores.length;
      if (total === 0) return null;

      // Add epsilon to prevent exact start/end overlap for full circles
      const startAngle = (index / total) * 2 * Math.PI + epsilon;
      const endAngle = ((index + 1) / total) * 2 * Math.PI - epsilon;

      // Ensure endAngle is slightly larger than startAngle for small slices
      if (endAngle <= startAngle) {
        // This handles the case of a single slice making a full circle
        // Or potential floating point issues making endAngle slightly smaller
        // We draw a full ring segment in this case
        return {
          path: `
            M ${center.x + radius},${center.y}
            A ${radius},${radius} 0 1 1 ${center.x + radius - epsilon},${
              center.y
            }
            L ${center.x + innerRadius - epsilon},${center.y}
            A ${innerRadius},${innerRadius} 0 1 0 ${center.x + innerRadius},${
              center.y
            }
            Z
          `,

          fill:
            scoreColors[score.score as keyof typeof scoreColors] || "#cccccc",
          score,
        };
      }

      // Round coordinates to avoid floating point issues
      const round = (val: number) => Math.round(val * 1000) / 1000;

      const outerX1 = round(center.x + radius * Math.sin(startAngle));
      const outerY1 = round(center.y - radius * Math.cos(startAngle));
      const outerX2 = round(center.x + radius * Math.sin(endAngle));
      const outerY2 = round(center.y - radius * Math.cos(endAngle));

      const innerX1 = round(center.x + innerRadius * Math.sin(endAngle));
      const innerY1 = round(center.y - innerRadius * Math.cos(endAngle));
      const innerX2 = round(center.x + innerRadius * Math.sin(startAngle));
      const innerY2 = round(center.y - innerRadius * Math.cos(startAngle));

      if (
        [
          outerX1,
          outerY1,
          outerX2,
          outerY2,
          innerX1,
          innerY1,
          innerX2,
          innerY2,
        ].some(isNaN)
      ) {
        console.error("NaN coordinate detected in slice", index, score);
        return null;
      }

      const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
      // ** Revert sweep flag to original logic (was 0) **
      const sweepFlagInner = 0;

      const path = `
      M ${outerX1},${outerY1}
      A ${radius},${radius} 0 ${largeArcFlag} 1 ${outerX2},${outerY2}
      L ${innerX1},${innerY1}
      A ${innerRadius},${innerRadius} 0 ${largeArcFlag} ${sweepFlagInner} ${innerX2},${innerY2}
      Z
    `;

      const fill =
        scoreColors[score.score as keyof typeof scoreColors] || "#cccccc";

      return {
        path,
        fill,
        score,
      };
    })
    .filter((slice) => slice !== null);

  return (
    <div
      className="relative group flex items-center justify-center"
      style={{ width: size, height: size }}
      data-oid="1:a36bc"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="inline-block"
        style={{ display: "block" }}
        data-oid="-xnc3iu"
      >
        {slices.map(
          (slice, index) =>
            slice && (
              <path
                key={index}
                d={slice.path}
                fill={slice.fill}
                stroke="#fff"
                strokeWidth="0.5"
                data-oid="e_ya9.u"
              />
            ),
        )}
      </svg>

      {/* Tooltip */}
      <div
        className="absolute left-full ml-2 top-0 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transform scale-95 group-hover:scale-100 origin-top-left transition-all duration-200 ease-in-out bg-white dark:bg-gray-800 shadow-lg rounded p-2 w-64"
        data-oid="oc_6c1u"
      >
        <p
          className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          data-oid="4vdiu6:"
        >
          Trait Scores:
        </p>
        <ul className="space-y-1" data-oid="d3-5hzm">
          {traitScores.map((trait, index) => (
            <li key={index} className="text-xs" data-oid="yg:suop">
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{
                  backgroundColor:
                    scoreColors[trait.score as keyof typeof scoreColors],
                }}
                data-oid="e:x-ckg"
              ></span>
              <strong data-oid="r5kzuv-">{trait.trait}:</strong> {trait.score}
            </li>
          ))}
        </ul>
      </div>
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
    null,
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

  // State for virtualization - visible range
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(20); // Show initial 20 results

  // Track scroll position and container size
  const containerRef = useRef<HTMLDivElement>(null);

  // Number of items to render outside visible area (buffer)
  const OVERSCAN_COUNT = 5;

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

  // *** Wrap estimateRowHeight in useCallback ***
  const estimateRowHeight = useCallback(
    (index: number) => {
      let height = 90;
      const result = results[index]; // Depends on results prop
      if (result?.trait_scores && result.trait_scores.length > 0) {
        height += Math.max(10, result.trait_scores.length * 28);
        const hasEvidence = result.trait_scores.some(
          (score) => score.evidence && score.evidence.length > 0,
        );
        if (hasEvidence) {
          height += 20;
        }
      }
      return height;
    },
    [results],
  ); // Add results as dependency

  // Calculate which items are visible based on scroll position
  const updateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop =
      containerRef.current.getBoundingClientRect().top + scrollTop;
    const viewportHeight = window.innerHeight;

    // If all results can fit on screen, just show all of them
    if (results.length <= 30) {
      setStartIndex(0);
      setEndIndex(results.length - 1);
      return;
    }

    // Calculate visible indices
    let visibleStartIndex = 0;
    let visibleEndIndex = 0;
    let accumulatedHeight = 0;

    // Find the first visible item
    for (let i = 0; i < results.length; i++) {
      const height = estimateRowHeight(i);

      if (accumulatedHeight + containerTop + height > scrollTop) {
        visibleStartIndex = Math.max(0, i - OVERSCAN_COUNT);
        break;
      }

      accumulatedHeight += height;
    }

    // Find the last visible item
    accumulatedHeight = 0;
    for (let i = 0; i < results.length; i++) {
      const height = estimateRowHeight(i);
      accumulatedHeight += height;

      if (accumulatedHeight + containerTop > scrollTop + viewportHeight) {
        visibleEndIndex = Math.min(results.length - 1, i + OVERSCAN_COUNT);
        break;
      }
    }

    // If we got to the end without breaking, show all remaining items
    if (visibleEndIndex === 0) {
      visibleEndIndex = results.length - 1;
    }

    // Always show at least 15 items and never less than what we already have loaded
    visibleEndIndex = Math.max(
      visibleEndIndex,
      visibleStartIndex + 15,
      startIndex + 5,
    );

    setStartIndex(visibleStartIndex);
    setEndIndex(visibleEndIndex);
  }, [results, OVERSCAN_COUNT, estimateRowHeight, startIndex]);

  // Set up scroll handler
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(updateVisibleItems);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    // Initial calculation
    updateVisibleItems();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateVisibleItems]);

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
      <div className="text-center py-12" data-oid="yun24yi">
        <p className="text-gray-600 dark:text-gray-400 mb-2" data-oid="tc-4ubr">
          No results found for &quot;{query}&quot;
        </p>
        <p className="text-gray-500 dark:text-gray-500" data-oid="i-d-j2k">
          Try a different search term or broaden your query
        </p>
      </div>
    );
  }

  // Generate placeholders for virtualized non-visible items
  const visibleResults = results.slice(startIndex, endIndex + 1);

  // Calculate height of top placeholder
  const topPlaceholderHeight =
    startIndex > 0
      ? Array.from({ length: startIndex }, (_, i) =>
          estimateRowHeight(i),
        ).reduce((sum, height) => sum + height, 0)
      : 0;

  // Calculate height of bottom placeholder
  const bottomPlaceholderHeight =
    endIndex < results.length - 1
      ? Array.from({ length: results.length - endIndex - 1 }, (_, i) =>
          estimateRowHeight(endIndex + 1 + i),
        ).reduce((sum, height) => sum + height, 0)
      : 0;

  return (
    <div
      className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg"
      ref={containerRef}
      data-oid="su5czmi"
    >
      <div className="min-w-[640px]" data-oid="z9qyddi">
        {" "}
        {/* Minimum width container to ensure scrolling on mobile */}
        {/* Table header */}
        <div
          className="bg-gray-50 dark:bg-gray-800 flex border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
          data-oid="x9yl6se"
        >
          <div
            className="w-10 sm:w-12 px-2 sm:px-3 py-2 sm:py-3 text-left"
            data-oid="r76:6o."
          >
            <span className="sr-only" data-oid="dchkrcy">
              Select
            </span>
          </div>
          <div
            className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-14 sm:w-16"
            data-oid="yq.vrgi"
          >
            Score
          </div>
          <div
            className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36 sm:w-56"
            data-oid="i-p:xmp"
          >
            Name
          </div>
          <div
            className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-1"
            data-oid="ycoerg4"
          >
            Relevant Info
          </div>
          <div
            className="hidden sm:block px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40"
            data-oid="mhkezer"
          >
            Previous Emails
          </div>
          <div
            className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16 sm:w-24"
            data-oid="gby033-"
          >
            LinkedIn
          </div>
        </div>
        {/* Top spacer */}
        {topPlaceholderHeight > 0 && (
          <div style={{ height: topPlaceholderHeight }} data-oid="kfstu9." />
        )}
        {/* Visible items */}
        <div className="bg-white dark:bg-gray-900" data-oid="tbpmdyu">
          {visibleResults.map((result) => {
            const profile = convertToProfileFrontend(result);
            const isSelected = selectedProfiles.some(
              (p) => p.id === profile.id,
            );

            return (
              <div
                key={profile.id}
                className={`flex border-b border-gray-200 dark:border-gray-700 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                } cursor-pointer transition-colors duration-150 ease-in-out`}
                onMouseEnter={(e) => handleRowHover(profile, e)}
                onMouseLeave={handleRowHoverEnd}
                onClick={() => handleRowClick(profile)}
                data-oid="5a:n_or"
              >
                {/* Checkbox column */}
                <div
                  className="px-2 sm:px-3 py-3 sm:py-4 flex items-center w-10 sm:w-12"
                  data-oid="643qp:e"
                >
                  <div
                    className="flex items-center h-5"
                    onClick={(e) => e.stopPropagation()}
                    data-oid="9gu2b:k"
                  >
                    <input
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={isSelected}
                      onChange={(e) =>
                        onProfileSelect(profile, e.target.checked)
                      }
                      data-oid="bgvnwkh"
                    />
                  </div>
                </div>

                {/* Score column */}
                <div
                  className="px-2 sm:px-3 py-3 sm:py-4 flex items-center justify-center w-14 sm:w-16 min-h-[50px] sm:min-h-[60px]"
                  data-oid="95z6q2w"
                >
                  {result.trait_scores && result.trait_scores.length > 0 ? (
                    <TraitScoreCircle
                      traitScores={result.trait_scores}
                      data-oid="7aw67hz"
                    />
                  ) : (
                    <span
                      className="text-xs italic text-gray-400"
                      data-oid="w.ore5k"
                    >
                      No scores
                    </span>
                  )}
                </div>

                {/* Name column */}
                <div
                  className="px-2 sm:px-3 py-3 sm:py-4 flex items-center w-36 sm:w-56"
                  data-oid="2vu6une"
                >
                  <div className="flex items-center" data-oid="6wtult3">
                    <div
                      className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                      data-oid="9iycs5p"
                    >
                      <ProfileImage
                        imageUrl={profile.profilePicture}
                        firstName={profile.firstName}
                        lastName={profile.lastName}
                        size="sm"
                        data-oid="xi1uial"
                      />
                    </div>
                    <div
                      className="ml-2 sm:ml-4 max-w-[8rem] sm:max-w-[12rem] relative"
                      data-oid="v:.uax8"
                    >
                      <div
                        className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-full"
                        data-oid="6b6vg:9"
                      >
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div
                        className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-full"
                        data-oid=":fecss1"
                      >
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
                          data-oid="g:xa.tt"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Relevant Info column */}
                <div
                  className="px-2 sm:px-3 py-3 sm:py-4 flex-1"
                  data-oid="852p:po"
                >
                  <div
                    className="text-sm text-gray-500 dark:text-gray-400"
                    data-oid="ya7d08j"
                  >
                    {result.trait_scores ? (
                      <div data-oid="9_u-6e9">
                        <ul
                          className="list-disc pl-4 space-y-1"
                          data-oid="41hhpzc"
                        >
                          {result.trait_scores.map((t, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-700 dark:text-gray-300 break-words"
                              data-oid="l2k1jw1"
                            >
                              <span
                                className="font-semibold"
                                data-oid="4:6xa76"
                              >
                                {t.trait}:
                              </span>{" "}
                              {t.score}
                              {t.evidence && (
                                <span
                                  className="block text-xs italic text-gray-500 dark:text-gray-400 mt-0.5 ml-2"
                                  data-oid="7d3kjtl"
                                >
                                  {t.evidence}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span
                        className="text-xs text-gray-400 dark:text-gray-500 italic"
                        data-oid="i:vq0.7"
                      >
                        No trait scores available
                      </span>
                    )}
                  </div>
                </div>

                {/* Previous Emails column */}
                <div
                  className="hidden sm:block px-3 py-4 w-40"
                  data-oid="-4vw8xj"
                >
                  <div
                    className="text-sm text-gray-500 dark:text-gray-400"
                    data-oid="dn_t2qu"
                  >
                    {/* Placeholder for previous emails */}
                    <span
                      className="text-xs text-gray-400 dark:text-gray-500 italic"
                      data-oid=":oh.skc"
                    >
                      Not implemented yet
                    </span>
                  </div>
                </div>

                {/* LinkedIn column */}
                <div
                  className="px-2 sm:px-3 py-3 sm:py-4 w-16 sm:w-24"
                  data-oid="9t192rc"
                >
                  {profile.profileUrl ? (
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      data-oid=":a2m9vd"
                    >
                      <FaLinkedin className="inline mr-1" data-oid="8aalofk" />
                    </a>
                  ) : (
                    <span
                      className="text-xs text-gray-400 dark:text-gray-500 italic"
                      data-oid="hxqhcu5"
                    >
                      No link
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Bottom spacer */}
        {bottomPlaceholderHeight > 0 && (
          <div style={{ height: bottomPlaceholderHeight }} data-oid=":9uq9p5" />
        )}
      </div>{" "}
      {/* End of min-width container */}
      {/* Profile Preview on Hover */}
      {hoveredProfile && previewPosition && (
        <div
          className="absolute z-20 shadow-lg rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 max-w-md"
          style={{
            top: `${previewPosition.y}px`,
            left: `${previewPosition.x}px`,
            maxWidth: "320px",
          }}
          data-oid="47qwi71"
        >
          <div className="flex items-start" data-oid="2xmdz:4">
            <div className="flex-shrink-0 mr-4" data-oid="4csf096">
              <ProfileImage
                imageUrl={hoveredProfile.profilePicture}
                firstName={hoveredProfile.firstName}
                lastName={hoveredProfile.lastName}
                size="md"
                data-oid="1ay4k9h"
              />
            </div>
            <div data-oid="tajvrkm">
              <h3
                className="text-lg font-medium text-gray-900 dark:text-gray-100"
                data-oid="q4zj8rv"
              >
                {hoveredProfile.firstName} {hoveredProfile.lastName}
              </h3>
              <p
                className="text-sm text-gray-600 dark:text-gray-400 mb-2"
                data-oid="93vjjpi"
              >
                {hoveredProfile.headline}
              </p>
              {hoveredProfile.summary && (
                <div
                  className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2"
                  data-oid="gh84-b:"
                >
                  {hoveredProfile.summary}
                </div>
              )}
              <p
                className="text-xs text-gray-500 dark:text-gray-500 italic"
                data-oid="oxpe.pc"
              >
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
          data-oid="_5shl-_"
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto p-3 sm:p-6 m-2 sm:m-4 w-full"
            data-oid="c135mt_"
          >
            <div className="flex justify-between mb-4" data-oid="tg0mxv7">
              <h2
                className="text-xl font-bold text-gray-900 dark:text-gray-100"
                data-oid="_lj.z.g"
              >
                Profile Details
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setSelectedProfileForDetail(null)}
                data-oid=":vktn6z"
              >
                &times;
              </button>
            </div>
            <div data-oid="ufagua7">
              <ProfileCard
                profile={selectedProfileForDetail}
                selectable={false}
                initialExpanded={true} // Auto-expand the profile card
                data-oid="b5-mlte"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
