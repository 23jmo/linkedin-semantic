"use client";

import { useState } from "react";
import {
  FaLinkedin,
  FaChevronDown,
  FaChevronUp,
  FaBriefcase,
  FaMapMarkerAlt,
  FaIndustry,
  FaGraduationCap,
  FaTools,
} from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import { Profile } from "@/types/profile";
import CompanyLogo from "./CompanyLogo";
import ProfileImage from "./ProfileImage";
import SchoolLogo from "./SchoolLogo";

interface ProfileCardProps {
  profile: Profile;
  matchScore: number;
  onSelect?: (profile: Profile, selected: boolean) => void;
  isSelected?: boolean;
  selectable?: boolean;
}

export default function ProfileCard({
  profile,
  matchScore,
  onSelect,
  isSelected = false,
  selectable = false,
}: ProfileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { resolvedTheme } = useTheme();

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(profile, e.target.checked);
    }
  };

  const formatDate = (dateObj?: { month?: number; year?: number }) => {
    if (!dateObj || !dateObj.year) return "Present";

    const month = dateObj.month
      ? new Date(0, dateObj.month - 1).toLocaleString("default", {
          month: "short",
        })
      : "";

    return `${month} ${dateObj.year}`;
  };

  return (
    <div
      className={`${
        resolvedTheme === "light"
          ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
          : "bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-lg"
      } border rounded-lg shadow-md p-6 relative transition-all duration-200 hover:-translate-y-1`}
    >
      {/* Selection checkbox */}
      {selectable && (
        <div className="absolute top-4 right-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Select ${profile.firstName} ${profile.lastName}`}
          />
        </div>
      )}

      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          <ProfileImage
            imageUrl={profile.profilePicture}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size="lg"
          />
        </div>
        <div className="flex-grow pr-12">
          <div className="flex items-center gap-2 mb-1">
            <h2
              className={`text-xl font-bold ${
                resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
            >
              {profile.firstName} {profile.lastName}
            </h2>
            <div
              className={`${
                resolvedTheme === "light"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-[#0a4a6e] text-[#4db6e8]"
              } px-2 py-0.5 rounded-full text-xs font-medium`}
            >
              {Math.round(matchScore * 100)}%
            </div>
          </div>
          <p
            className={`text-lg ${
              resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
            } mb-1`}
          >
            {profile.headline || "LinkedIn Member"}
          </p>
          {profile.location && (
            <p
              className={`flex items-center ${
                resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
              } mb-1`}
            >
              <FaMapMarkerAlt
                className={`mr-1 ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
              />
              {profile.location}
            </p>
          )}
          {profile.industry && (
            <p
              className={`flex items-center ${
                resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
              } mb-1`}
            >
              <FaBriefcase
                className={`mr-1 ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
              />
              {profile.industry}
            </p>
          )}
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center ${
              resolvedTheme === "light"
                ? "text-[#0077b5] hover:text-[#0066a1]"
                : "text-[#0a85c7] hover:text-[#0a95e0]"
            } mt-2`}
          >
            <FaLinkedin className="mr-1" />
            View LinkedIn Profile
          </a>
        </div>
      </div>

      {profile.highlights && profile.highlights.length > 0 && (
        <div className="mt-4">
          <h3
            className={`text-md font-semibold ${
              resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
            } mb-2`}
          >
            Highlights
          </h3>
          <ul className="list-disc pl-5">
            {profile.highlights.map((highlight: string, index: number) => (
              <li
                key={index}
                className={
                  resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
                }
              >
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={toggleExpanded}
          className={`flex items-center ${
            resolvedTheme === "light"
              ? "text-blue-600 hover:text-blue-800"
              : "text-blue-400 hover:text-blue-300"
          } font-medium`}
        >
          {expanded ? (
            <>
              <FaChevronUp className="mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <FaChevronDown className="mr-1" />
              View More
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-6">
          <div>
            <h3
              className={`text-md font-semibold ${
                resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
              } mb-2`}
            >
              Summary
            </h3>
            {profile.summary ? (
              <p
                className={
                  resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
                }
              >
                {profile.summary}
              </p>
            ) : (
              <p
                className={`italic ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
              >
                No summary available
              </p>
            )}
          </div>

          {profile.raw_profile_data?.experiences &&
            profile.raw_profile_data.experiences.length > 0 && (
              <div>
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                >
                  <FaBriefcase className="mr-2" /> Experience
                </h3>
                <div className="space-y-4">
                  {profile.raw_profile_data.experiences.map((exp, index) => (
                    <div
                      key={index}
                      className="ml-2 border-l-2 pl-4 border-gray-300 dark:border-gray-600"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          <CompanyLogo
                            logoUrl={exp.logo_url}
                            companyName={exp.company}
                          />
                        </div>
                        <div className="flex-grow">
                          <h4
                            className={`font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-800"
                                : "text-gray-200"
                            }`}
                          >
                            {exp.title || "Role"}
                          </h4>
                          <p
                            className={`${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            }`}
                          >
                            {exp.company || "Company"}
                          </p>
                          <p
                            className={`text-sm ${
                              resolvedTheme === "light"
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {formatDate(exp.starts_at)} -{" "}
                            {formatDate(exp.ends_at)}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                          {exp.description && (
                            <p
                              className={`mt-2 text-sm ${
                                resolvedTheme === "light"
                                  ? "text-gray-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {profile.raw_profile_data?.education &&
            profile.raw_profile_data.education.length > 0 && (
              <div>
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                >
                  <FaGraduationCap className="mr-2" /> Education
                </h3>
                <div className="space-y-4">
                  {profile.raw_profile_data.education.map((edu, index) => (
                    <div
                      key={index}
                      className="ml-2 border-l-2 pl-4 border-gray-300 dark:border-gray-600"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          <SchoolLogo
                            logoUrl={edu.logo_url}
                            schoolName={edu.school}
                          />
                        </div>
                        <div className="flex-grow">
                          <h4
                            className={`font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-800"
                                : "text-gray-200"
                            }`}
                          >
                            {edu.school || "School"}
                          </h4>
                          <p
                            className={`${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            }`}
                          >
                            {edu.degree_name || ""}{" "}
                            {edu.field_of_study
                              ? `· ${edu.field_of_study}`
                              : ""}
                          </p>
                          <p
                            className={`text-sm ${
                              resolvedTheme === "light"
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {edu.starts_at?.year || ""} -{" "}
                            {edu.ends_at?.year || "Present"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {profile.raw_profile_data?.skills &&
            profile.raw_profile_data.skills.length > 0 && (
              <div>
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                >
                  <FaTools className="mr-2" /> Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.raw_profile_data.skills.map(
                    (skill, index) =>
                      skill.name && (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${
                            resolvedTheme === "light"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-blue-900/30 text-blue-300"
                          }`}
                        >
                          {skill.name}
                        </span>
                      )
                  )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
