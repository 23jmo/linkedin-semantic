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
      data-oid="c.6960w"
    >
      {/* Selection checkbox */}
      {selectable && (
        <div className="absolute top-4 right-4 z-10" data-oid="dgw063c">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Select ${profile.firstName} ${profile.lastName}`}
            data-oid="48o5.gc"
          />
        </div>
      )}

      <div className="flex items-start" data-oid="s_52swl">
        <div className="flex-shrink-0 mr-4" data-oid="qdf_qq2">
          <ProfileImage
            imageUrl={profile.profilePicture}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size="lg"
            data-oid="1rgvk7m"
          />
        </div>
        <div className="flex-grow pr-12" data-oid="hqxs8od">
          <div className="flex items-center gap-2 mb-1" data-oid="f-ft3qx">
            <h2
              className={`text-xl font-bold ${
                resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
              data-oid="bel_ben"
            >
              {profile.firstName} {profile.lastName}
            </h2>
            <p
              className={`text-lg ${
                resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
              } mb-1`}
              data-oid="pu-nib-"
            >
              {profile.headline || "LinkedIn Member"}
            </p>
          </div>
          {profile.location && (
            <p
              className={`flex items-center ${
                resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
              } mb-1`}
              data-oid="by5sb0h"
            >
              <FaMapMarkerAlt
                className={`mr-1 ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
                data-oid="nl.:osf"
              />

              {profile.location}
            </p>
          )}
          {profile.industry && (
            <p
              className={`flex items-center ${
                resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
              } mb-1`}
              data-oid="i7po.:e"
            >
              <FaBriefcase
                className={`mr-1 ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
                data-oid="r1qzrxe"
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
            data-oid="pe1iuds"
          >
            <FaLinkedin className="mr-1" data-oid="bcxt-:2" />
            View LinkedIn Profile
          </a>
        </div>
      </div>

      {profile.highlights && profile.highlights.length > 0 && (
        <div className="mt-4" data-oid="-4yz2.d">
          <h3
            className={`text-md font-semibold ${
              resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
            } mb-2`}
            data-oid="xttr3w8"
          >
            Highlights
          </h3>
          <ul className="list-disc pl-5" data-oid="b8ipf7t">
            {profile.highlights.map((highlight: string, index: number) => (
              <li
                key={index}
                className={
                  resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
                }
                data-oid="y_-xg1q"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4" data-oid="uwqzoy0">
        <button
          onClick={toggleExpanded}
          className={`flex items-center ${
            resolvedTheme === "light"
              ? "text-blue-600 hover:text-blue-800"
              : "text-blue-400 hover:text-blue-300"
          } font-medium`}
          data-oid="sxfzvi6"
        >
          {expanded ? (
            <>
              <FaChevronUp className="mr-1" data-oid="yfq:bd." />
              Hide Details
            </>
          ) : (
            <>
              <FaChevronDown className="mr-1" data-oid="n:b6-sl" />
              View More
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-6" data-oid="-p3stw0">
          <div data-oid="3pqm_6d">
            <h3
              className={`text-md font-semibold ${
                resolvedTheme === "light" ? "text-gray-700" : "text-gray-300"
              } mb-2`}
              data-oid="b:-iel8"
            >
              Summary
            </h3>
            {profile.summary ? (
              <p
                className={
                  resolvedTheme === "light" ? "text-gray-600" : "text-gray-400"
                }
                data-oid="1-_b9rp"
              >
                {profile.summary}
              </p>
            ) : (
              <p
                className={`italic ${
                  resolvedTheme === "light" ? "text-gray-500" : "text-gray-500"
                }`}
                data-oid="f69rq43"
              >
                No summary available
              </p>
            )}
          </div>

          {profile.raw_profile_data?.experiences &&
            profile.raw_profile_data.experiences.length > 0 && (
              <div data-oid="rx.2ljn">
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                  data-oid=".pw9cup"
                >
                  <FaBriefcase className="mr-2" data-oid="-hz9nbl" /> Experience
                </h3>
                <div className="space-y-4" data-oid="gia2u:s">
                  {profile.raw_profile_data.experiences.map((exp, index) => (
                    <div
                      key={index}
                      className="ml-2 border-l-2 pl-4 border-gray-300 dark:border-gray-600"
                      data-oid="twmqw.-"
                    >
                      <div className="flex items-start" data-oid="4uq-5c8">
                        <div
                          className="flex-shrink-0 mr-3 mt-1"
                          data-oid="6:6fvr2"
                        >
                          <CompanyLogo
                            logoUrl={exp.logo_url ?? undefined}
                            companyName={exp.company ?? undefined}
                            data-oid="74_dy.a"
                          />
                        </div>
                        <div className="flex-grow" data-oid=":-1br7y">
                          <h4
                            className={`font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-800"
                                : "text-gray-200"
                            }`}
                            data-oid="h8cje-3"
                          >
                            {exp.title || "Role"}
                          </h4>
                          <p
                            className={`${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            }`}
                            data-oid="n9h7zcn"
                          >
                            {exp.company || "Company"}
                          </p>
                          <p
                            className={`text-sm ${
                              resolvedTheme === "light"
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                            data-oid="ghx70vi"
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
                              data-oid="7dmsk-a"
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
              <div data-oid="fwhi5ga">
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                  data-oid="ywh::7z"
                >
                  <FaGraduationCap className="mr-2" data-oid="kk59mtm" />{" "}
                  Education
                </h3>
                <div className="space-y-4" data-oid="zvg4rxd">
                  {profile.raw_profile_data.education.map((edu, index) => (
                    <div
                      key={index}
                      className="ml-2 border-l-2 pl-4 border-gray-300 dark:border-gray-600"
                      data-oid="yghm8k."
                    >
                      <div className="flex items-start" data-oid="q81-_e7">
                        <div
                          className="flex-shrink-0 mr-3 mt-1"
                          data-oid="2ser4ev"
                        >
                          <SchoolLogo
                            logoUrl={edu.logo_url ?? undefined}
                            schoolName={edu.school}
                            data-oid="o_a0axs"
                          />
                        </div>
                        <div className="flex-grow" data-oid=".4-i:02">
                          <h4
                            className={`font-medium ${
                              resolvedTheme === "light"
                                ? "text-gray-800"
                                : "text-gray-200"
                            }`}
                            data-oid="w1kgowp"
                          >
                            {edu.school || "School"}
                          </h4>
                          <p
                            className={`${
                              resolvedTheme === "light"
                                ? "text-gray-700"
                                : "text-gray-300"
                            }`}
                            data-oid="7zxlz7h"
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
                            data-oid="mzu9l1s"
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
              <div data-oid="b-wvab7">
                <h3
                  className={`text-md font-semibold flex items-center ${
                    resolvedTheme === "light"
                      ? "text-gray-700"
                      : "text-gray-300"
                  } mb-3`}
                  data-oid="8vfi4o6"
                >
                  <FaTools className="mr-2" data-oid="k-_msc:" /> Skills
                </h3>
                <div className="flex flex-wrap gap-2" data-oid="0orcpps">
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
                          data-oid="nyelc63"
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
