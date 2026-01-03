import React from "react";

const EventCardSkeleton = () => {
  return (
    <article className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden shadow-sm animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-3 w-16 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
      </div>

      {/* Media Skeleton */}
      <div className="w-full aspect-square bg-gray-300"></div>

      {/* Actions Skeleton */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
        </div>
        <div className="h-4 w-20 bg-gray-300 rounded mb-2"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-300 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
        </div>
      </div>
    </article>
  );
};

export default EventCardSkeleton;

