import SearchBox from "./SearchBox";

interface SearchControlsProps {
  initialQuery: string;
  onSearch: (query: string) => void;
}

export default function SearchControls({
  initialQuery,
  onSearch,
}: SearchControlsProps) {
  return (
    <div className="mb-8">
      <SearchBox
        initialQuery={initialQuery}
        onSearch={onSearch}
      />
    </div>
  );
}
