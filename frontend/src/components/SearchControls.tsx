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
    <div className="mb-8" data-oid="kcr-uy1">
      <SearchBox
        initialQuery={initialQuery}
        onSearch={onSearch}
        data-oid="bpedb2-"
      />
    </div>
  );
}
