"use client";

import { useState } from "react";
import Image from "next/image";
import { FaLinkedin, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface Profile {
  id: string;
  linkedin_id: string;
  name: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  profile_url?: string;
  profile_image_url?: string;
  score: number;
  highlights?: string[];
}

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            {profile.profile_image_url ? (
              <Image
                src={profile.profile_image_url}
                alt={profile.name}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">
                  {profile.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                {profile.headline && (
                  <p className="text-gray-600">{profile.headline}</p>
                )}
                {profile.location && (
                  <p className="text-gray-500 text-sm mt-1">
                    {profile.location}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  Match: {Math.round(profile.score * 100)}%
                </span>

                {profile.profile_url && (
                  <a
                    href={profile.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 ml-2"
                  >
                    <FaLinkedin size={20} />
                  </a>
                )}
              </div>
            </div>

            {profile.highlights && profile.highlights.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {profile.highlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
            >
              {expanded ? (
                <>
                  <span>Show less</span>
                  <FaChevronUp className="ml-1" />
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <FaChevronDown className="ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {expanded && profile.summary && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-lg font-medium mb-2">Summary</h4>
            <p className="text-gray-700">{profile.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
