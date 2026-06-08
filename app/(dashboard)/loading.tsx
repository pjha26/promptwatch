export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-pulse">
      {/* Title Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 border border-primary rounded-none"></div>
        <div className="mt-2 h-4 w-12 bg-gray-200 border border-primary rounded-none"></div>
      </div>
      
      {/* Chart/Banner Skeleton */}
      <div className="w-full bg-gray-100 border border-primary rounded-none shadow-[4px_4px_0px_0px_#e5e5e5] mb-6 min-h-[300px] h-[35vh]"></div>
      
      {/* Panels Skeleton */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white border border-primary rounded-none shadow-[4px_4px_0px_0px_#e5e5e5] p-6">
          <div className="h-4 w-32 bg-gray-200 mb-6 border border-primary"></div>
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className={`h-3 bg-gray-200 border border-primary ${['w-[70%]', 'w-[50%]', 'w-[65%]', 'w-[40%]', 'w-[80%]'][i]}`}></div>
                <div className="h-3 bg-gray-200 border border-primary w-10"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white border border-primary rounded-none shadow-[4px_4px_0px_0px_#e5e5e5] p-6">
          <div className="h-4 w-32 bg-gray-200 mb-6 border border-primary"></div>
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-6 h-6 bg-gray-200 border border-primary shrink-0"></div>
                  <div className={`h-3 bg-gray-200 border border-primary ${['w-[60%]', 'w-[80%]', 'w-[45%]', 'w-[55%]', 'w-[75%]'][i]}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
