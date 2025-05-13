export default function SkeletonProfileCard() {
  return (
    <div
      className="min-w-[400px] max-w-[1000px] w-xl h-[200px] border rounded-lg shadow-md p-6 relative transition-all duration-300 ease-out flex-shrink-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      style={{
        width: "600px", // Skinnier width
      }}
      data-oid="hd6iv3g"
    >
      <div
        className="relative z-10 flex items-start pointer-events-auto"
        data-oid="3u3iz2e"
      >
        <div className="flex-shrink-0 mr-4" data-oid="uj.udjo">
          {/* Profile picture skeleton */}
          <div
            className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
            data-oid="sfeqbde"
          />
        </div>

        <div className="flex-grow pr-12" data-oid="zkkc6xz">
          {/* Name skeleton */}
          <div
            className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"
            data-oid="9-fh7z8"
          />

          {/* Headline skeleton */}
          <div
            className="h-6 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"
            data-oid="pfnzyu4"
          />

          {/* Location skeleton */}
          <div className="flex items-center mb-1" data-oid="p:7:p4i">
            <div
              className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-1"
              data-oid="d9bnske"
            />

            <div
              className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              data-oid="bkdjcnj"
            />
          </div>

          {/* Industry skeleton */}
          <div className="flex items-center mb-1" data-oid="6p_y8cr">
            <div
              className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-1"
              data-oid="iqqmoz_"
            />

            <div
              className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              data-oid="krg3a_q"
            />
          </div>

          {/* LinkedIn link skeleton */}
          <div className="flex items-center mt-2" data-oid="00qfm46">
            <div
              className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-1"
              data-oid="r8ldn:_"
            />

            <div
              className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              data-oid="u7m-f.-"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
