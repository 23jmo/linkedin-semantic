"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FaLinkedin,
  FaChevronDown,
  FaChevronUp,
  FaBriefcase,
  FaMapMarkerAlt,
  FaIndustry,
} from "react-icons/fa";
import { Profile } from "@/types/profile";
import { useTheme } from "@/lib/theme-context";

interface ProfileCardProps {
  profile: Profile;
  matchScore: number;
}

export default function ProfileCard({ profile, matchScore }: ProfileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { resolvedTheme } = useTheme();

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const scoreColor = () => {
    if (matchScore >= 0.8) return "text-green-600 dark:text-green-400";
    if (matchScore >= 0.6) return "text-blue-600 dark:text-blue-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const scoreBackground = () => {
    if (matchScore >= 0.8) return "bg-green-100 dark:bg-green-900/30";
    if (matchScore >= 0.6) return "bg-blue-100 dark:bg-blue-900/30";
    return "bg-gray-100 dark:bg-gray-800";
  };

  return (
    <div
      className={`${
        resolvedTheme === "light"
          ? "bg-white border-gray-200"
          : "bg-gray-800 border-gray-700"
      } rounded-lg shadow-md p-6 mb-4 border`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          {profile.profilePicture ? (
            <Image
              src={profile.profilePicture}
              alt={`${profile.firstName} ${profile.lastName}`}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div
              className={`${
                resolvedTheme === "light"
                  ? "bg-gray-200 text-gray-600"
                  : "bg-gray-700 text-gray-400"
              } w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold`}
            >
              {profile.firstName.charAt(0)}
              {profile.lastName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h2
            className={`text-xl font-bold ${
              resolvedTheme === "light" ? "text-gray-800" : "text-gray-200"
            }`}
          >
            {profile.firstName} {profile.lastName}
          </h2>
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
        <div className="flex-shrink-0 ml-4">
          <div
            className={`${
              resolvedTheme === "light"
                ? "bg-blue-100 text-blue-800"
                : "bg-[#0a4a6e] text-[#4db6e8]"
            } px-3 py-1 rounded-full text-sm font-medium`}
          >
            {Math.round(matchScore * 100)}% Match
          </div>
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
              Hide Summary
            </>
          ) : (
            <>
              <FaChevronDown className="mr-1" />
              Show Summary
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
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
      )}
    </div>
  );
}
