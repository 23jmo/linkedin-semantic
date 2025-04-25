export default function SkeletonProfileCard() {
  return (
    <div
      className="min-w-[400px] max-w-[1000px] w-xl h-[200px] border rounded-lg shadow-md p-6 relative transition-all duration-300 ease-out flex-shrink-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      style={{
        width: "600px", // Skinnier width
      }}
      data-oid="-njp1pw"
    >
      <div
        className="relative z-10 flex items-start pointer-events-auto"
        data-oid="2otels3"
      >
        <div className="flex-shrink-0 mr-4" data-oid="w4i_xmu">
          {/* Profile picture skeleton */}
          <div
            className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
            data-oid="fpev67c"
          />
        </div>

        <div className="flex-grow pr-12" data-oid="_cd6wzm">
          {/* Name skeleton */}
          <div
            className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"
            data-oid="udpdo63"
          />

          {/* Headline skeleton */}
          <div
            className="h-6 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"
            data-oid="parvqw:"
          />

          {/* Location skeleton */}
          <div className="flex items-center mb-1" data-oid="ldqb-j:">
            <div
              className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-1"
              data-oid="knkc-7g"
            />

            <div
              className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              data-oid="rmop009"
            />
          </div>

          {/* Industry skeleton */}
          <div className="flex items-center mb-1" data-oid="1_kjt88">
            <div
              className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-1"
              data-oid="fa_rw:4"
            />

            <div
              className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              data-oid="e-v2vv-"
            />
          </div>

          {/* LinkedIn link skeleton */}
          <div className="flex items-center mt-2" data-oid="zz0z1hr">
            <div
              className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-1"
              data-oid="gqacl0r"
            />

            <div
              className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              data-oid="c.3iu1j"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
