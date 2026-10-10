const Loading = () => {
  return (
    <div className="px-4 py-8 w-full md:px-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="w-1/3 h-8 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
        <div className="w-2/3 h-6 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Grid Skeleton Loaders */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="p-4 border border-gray-300 rounded-lg shadow-md bg-white animate-pulse"
          >
            {/* Title and Subtitle Skeleton */}
            <div className="mb-4 space-y-3">
              <div className="w-20 h-8 bg-gray-300 rounded-md"></div>
              <div className="w-32 h-6 bg-gray-300 rounded-md"></div>
            </div>

            {/* Icon and Text Skeleton */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="w-full h-6 bg-gray-300 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Loading;
