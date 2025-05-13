"use client";

import { useTheme } from "@/lib/theme-context";
import { FaLinkedin, FaMapMarkerAlt, FaBriefcase } from "react-icons/fa";
import ProfileImage from "./ProfileImage";
import type { Profile } from "@/types/types";

interface ScrollingProfileCardProps {
  profile: Profile;
  row: number;
}

export default function ScrollingProfileCard({
  profile,
  row,
}: ScrollingProfileCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`
        ${
          resolvedTheme === "light"
            ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md hover:shadow-blue-200/50"
            : "bg-gray-800 border-gray-700 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20"
        }
        min-w-[400px] max-w-[1000px] w-xl h-[200px]
        border rounded-lg shadow-md p-6 relative 
        transition-all duration-300 ease-out flex-shrink-0
        hover:-translate-y-1
        before:absolute before:inset-0 before:rounded-lg
        before:transition-opacity before:duration-300
        hover:before:opacity-100 before:opacity-0
        ${
          isDark
            ? "before:bg-gradient-to-r before:from-blue-500/10 before:via-purple-500/10 before:to-blue-500/10"
            : "before:bg-gradient-to-r before:from-blue-100/50 before:via-purple-100/50 before:to-blue-100/50"
        }
        hover:bg-gradient-to-r
        ${
          isDark
            ? "hover:from-gray-800 hover:via-gray-800/95 hover:to-gray-800"
            : "hover:from-white hover:via-white/95 hover:to-white"
        }
        hover:z-50
      `}
      style={{
        width: "600px", // Skinnier width
        opacity: Math.max(0.2, 1 - row * 0.25),
        transform: `translateZ(${-row * 100}px)`,
        zIndex: 10 - row,
      }}
      data-oid="mvkx8kc"
    >
      <div
        className="relative z-10 flex items-start pointer-events-auto"
        data-oid="jos6lg9"
      >
        <div className="flex-shrink-0 mr-4" data-oid="0ej3ymf">
          <ProfileImage
            imageUrl={profile.profile_picture_url}
            firstName={profile.full_name.split(" ")[0]}
            lastName={profile.full_name.split(" ").slice(1).join(" ")}
            size="lg"
            data-oid="t697irg"
          />
        </div>
        <div className="flex-grow pr-12" data-oid="6oeo90g">
          <div className="flex items-center gap-2 mb-1" data-oid="3k151pk">
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-gray-200" : "text-gray-800"
              }`}
              data-oid="51zopgw"
            >
              {profile.full_name}
            </h2>
          </div>

          <p
            className={`text-lg ${
              isDark ? "text-gray-300" : "text-gray-700"
            } mb-1`}
            data-oid="5sxcogd"
          >
            {profile.headline || "LinkedIn Member"}
          </p>

          {profile.location && (
            <p
              className={`flex items-center ${
                isDark ? "text-gray-400" : "text-gray-600"
              } mb-1`}
              data-oid="bs17fd1"
            >
              <FaMapMarkerAlt
                className={`mr-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                data-oid="g6qo6qx"
              />

              {profile.location}
            </p>
          )}

          {profile.industry && (
            <p
              className={`flex items-center ${
                isDark ? "text-gray-400" : "text-gray-600"
              } mb-1`}
              data-oid="q-dgg25"
            >
              <FaBriefcase
                className={`mr-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                data-oid="s6th01-"
              />

              {profile.industry}
            </p>
          )}

          {profile.profile_url && (
            <a
              href={profile.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center ${
                isDark
                  ? "text-[#0a85c7] hover:text-[#0a95e0]"
                  : "text-[#0077b5] hover:text-[#0066a1]"
              } mt-2`}
              data-oid="zlpqbqk"
            >
              <FaLinkedin className="mr-1" data-oid="-p48sbg" />
              View LinkedIn Profile
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
