import SearchBox from "./SearchBox";

interface SearchControlsProps {
  initialQuery: string;
}

export default function SearchControls({
  initialQuery,
}: SearchControlsProps) {
  return (
    <div className="mb-8">
      <SearchBox initialQuery={initialQuery} />
    </div>
  );
}
