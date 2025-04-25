"use client";

import { useState } from "react";
import {
  FaLinkedin,
  FaChevronDown,
  FaChevronUp,
  FaBriefcase,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaTools,
} from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import { ProfileFrontend } from "../types/types";
import CompanyLogo from "./CompanyLogo";
import ProfileImage from "./ProfileImage";
import SchoolLogo from "./SchoolLogo";

interface ProfileCardProps {
  profile: ProfileFrontend;
  onSelect?: (profile: ProfileFrontend, selected: boolean) => void;
  isSelected?: boolean;
  selectable?: boolean;
  initialExpanded?: boolean;
}

export default function ProfileCard({
  profile,
  onSelect,
  isSelected = false,
  selectable = false,
  initialExpanded = false,
}: ProfileCardProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
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
      } border rounded-lg shadow-md p-6 relative transition-all duration-200 hover:-translate-y-1 overflow-hidden`}
      data-oid="hjssfq3"
    >
      {/* Selection checkbox */}
      {selectable && (
        <div className="absolute top-4 right-4 z-10" data-oid="-iyc_wm">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Select ${profile.firstName} ${profile.lastName}`}
            data-oid="zi3ciei"
          />
        </div>
      )}

      <div className="flex items-start" data-oid="s7:di7t">
        <div className="flex-shrink-0 mr-4" data-oid="i4pjmux">
          <ProfileImage
            imageUrl={profile.profilePicture}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size="lg"
            data-oid="c7k:x:."
          />
        </div>
        <div className="flex-grow pr-12" data-oid="00z3o7q">
          <div className="flex items-center gap-2 mb-1" data-oid="u9hhudm">
            <h2
              className={`text-xl font-bold ${
                resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
              data-oid="ky3zohy"
            >
              {profile.firstName} {profile.lastName}
            </h2>
            <p
              className={`text-lg ${
                resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
              } mb-1`}
              data-oid="kk6rftk"
            >
              {profile.headline || "LinkedIn Member"}
            </p>
          </div>
          {profile.location && (
            <p
              className={`flex items-center ${
                resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
              } mb-1`}
              data-oid="redui8u"
            >
              <FaMapMarkerAlt
                className={`mr-1 ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
                data-oid="yb:thhv"
              />

              {profile.location}
            </p>
          )}
          {profile.industry && (
            <p
              className={`flex items-center ${
                resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
              } mb-1`}
              data-oid="kg4jio."
            >
              <FaBriefcase
                className={`mr-1 ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
                data-oid="984pkmv"
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
            data-oid=".aa5rc0"
          >
            <FaLinkedin className="mr-1" data-oid="g-ba-5:" />
            View LinkedIn Profile
          </a>
        </div>
      </div>

      {profile.highlights && profile.highlights.length > 0 && (
        <div className="mt-4" data-oid="wx3kes5">
          <h3
            className={`text-md font-semibold ${
              resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
            } mb-2`}
            data-oid="aiwsnwp"
          >
            Highlights
          </h3>
          <ul className="list-disc pl-5" data-oid="5tz-eyp">
            {profile.highlights.map((highlight: string, index: number) => (
              <li
                key={index}
                className={
                  resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
                }
                data-oid="c8l3avm"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4" data-oid="0ag7qj7">
        <button
          onClick={toggleExpanded}
          className={`flex items-center ${
            resolvedTheme === "light"
              ? "text-blue-600 hover:text-blue-800"
              : "text-blue-400 hover:text-blue-300"
          } font-medium`}
          data-oid="9::eiha"
        >
          {expanded ? (
            <>
              <FaChevronUp className="mr-1" data-oid="r4db82y" />
              Hide Details
            </>
          ) : (
            <>
              <FaChevronDown className="mr-1" data-oid="wn.eu1:" />
              View More
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-6" data-oid="td3ycxs">
          <div data-oid="2elmjo9">
            <h3
              className={`text-md font-semibold ${
                resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
              } mb-2`}
              data-oid="ub4.s2r"
            >
              Summary
            </h3>
            {profile.summary ? (
              <p
                className={
                  resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
                }
                data-oid="p_p:zpo"
              >
                {profile.summary}
              </p>
            ) : (
              <p
                className={`italic ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
                data-oid="0_pdq9o"
              >
                No summary available
              </p>
            )}
          </div>

          {profile.raw_profile_data?.experiences &&
            profile.raw_profile_data.experiences.length > 0 && (
              <div data-oid="o0u1kvm">
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                  data-oid="i4_3y0r"
                >
                  <FaBriefcase className="mr-2" data-oid="4jd3i.p" /> Experience
                </h3>
                <div className="space-y-4" data-oid="siz0ds.">
                  {profile.raw_profile_data.experiences.map((exp, index) => (
                    <div
                      key={index}
                      className="ml-2 border-l-2 pl-4 border-gray-300 dark:border-gray-600"
                      data-oid="_bv45r0"
                    >
                      <div className="flex items-start" data-oid=".yphc:-">
                        <div
                          className="flex-shrink-0 mr-3 mt-1"
                          data-oid="d.dzjpk"
                        >
                          <CompanyLogo
                            logoUrl={exp.logo_url ?? undefined}
                            companyName={exp.company ?? undefined}
                            data-oid="6_abcml"
                          />
                        </div>
                        <div className="flex-grow" data-oid="r2foo3m">
                          <h4
                            className={`font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-800"
                                : "text-gray-200"
                            }`}
                            data-oid="4dgcts2"
                          >
                            {exp.title || "Role"}
                          </h4>
                          <p
                            className={`${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            }`}
                            data-oid="4dq9hnu"
                          >
                            {exp.company || "Company"}
                          </p>
                          <p
                            className={`text-sm ${
                              resolvedTheme === "light"
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                            data-oid="u5gkfbf"
                          >
                            {formatDate(exp.start_at ?? undefined)} -{" "}
                            {formatDate(exp.ends_at ?? undefined)}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                          {exp.description && (
                            <p
                              className={`mt-2 text-sm ${
                                resolvedTheme === "light"
                                  ? "text-gray-600"
                                  : "text-gray-400"
                              }`}
                              data-oid="9p2xbtt"
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
              <div data-oid="s_2d.lu">
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                  data-oid="9m26hl8"
                >
                  <FaGraduationCap className="mr-2" data-oid="rrz2zab" />{" "}
                  Education
                </h3>
                <div className="space-y-4" data-oid="s7n2o7i">
                  {profile.raw_profile_data.education.map((edu, index) => (
                    <div
                      key={index}
                      className="ml-2 border-l-2 pl-4 border-gray-300 dark:border-gray-600"
                      data-oid="h8lxkpg"
                    >
                      <div className="flex items-start" data-oid="ch3m9-h">
                        <div
                          className="flex-shrink-0 mr-3 mt-1"
                          data-oid="f05k69f"
                        >
                          <SchoolLogo
                            logoUrl={edu.logo_url ?? undefined}
                            schoolName={edu.school}
                            data-oid="29phdj0"
                          />
                        </div>
                        <div className="flex-grow" data-oid="qzr6goo">
                          <h4
                            className={`font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-800"
                                : "text-gray-200"
                            }`}
                            data-oid="z4zu0s7"
                          >
                            {edu.school || "School"}
                          </h4>
                          <p
                            className={`${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            }`}
                            data-oid="z85s6gn"
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
                            data-oid="9auflje"
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
              <div data-oid="q2:2hnh">
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                  data-oid="q_.u_8b"
                >
                  <FaTools className="mr-2" data-oid="f89s5fs" /> Skills
                </h3>
                <div className="flex flex-wrap gap-2" data-oid="g5r-s2v">
                  {profile.raw_profile_data.skills.map(
                    (skill, index) =>
                      skill && (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${
                            resolvedTheme === "light"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-blue-900/30 text-blue-300"
                          }`}
                          data-oid="k3rllku"
                        >
                          {skill}
                        </span>
                      ),
                  )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
