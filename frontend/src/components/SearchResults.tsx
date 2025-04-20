import { ProfileFrontend } from "../types/types";
import { SearchResult } from "../types/types";
import ProfileCard from "./ProfileCard";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  selectedProfiles: ProfileFrontend[];
  onProfileSelect: (profile: ProfileFrontend, selected: boolean) => void;
}

export default function SearchResults({
  results,
  query,
  selectedProfiles,
  onProfileSelect,
}: SearchResultsProps) {
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
    <div className="space-y-6">
      {results.map((result) => {
        // Convert SearchResult to Profile for the ProfileCard
        const profile: ProfileFrontend = {
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

        // Check if this profile is selected
        const isSelected = selectedProfiles.some((p) => p.id === profile.id);

        return (
          <ProfileCard
            key={profile.id}
            profile={profile}
            matchScore={result.score}
            selectable={true}
            isSelected={isSelected}
            onSelect={onProfileSelect}
          />
        );
      })}
    </div>
  );
}
