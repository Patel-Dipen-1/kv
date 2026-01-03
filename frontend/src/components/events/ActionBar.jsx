import React from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";

const ActionBar = ({
  isLiked,
  onLike,
  onComment,
  onShare,
  likeCount = 0,
  commentCount = 0,
  showBookmark = false,
  onBookmark,
  isBookmarked = false,
}) => {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className={`transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 ${
              isLiked ? "text-red-600" : "text-gray-900 hover:text-red-600"
            }`}
            aria-label={isLiked ? "Unlike" : "Like"}
            aria-pressed={isLiked}
          >
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
          </button>

          <button
            onClick={onComment}
            className="text-gray-900 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Comment"
          >
            <MessageCircle size={24} />
          </button>

          <button
            onClick={onShare}
            className="text-gray-900 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Share"
          >
            <Share2 size={24} />
          </button>
        </div>

        {showBookmark && (
          <button
            onClick={onBookmark}
            className={`transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 ${
              isBookmarked ? "text-yellow-600" : "text-gray-900 hover:text-yellow-600"
            }`}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            aria-pressed={isBookmarked}
          >
            <Bookmark size={24} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {(likeCount > 0 || commentCount > 0) && (
        <div className="mt-2 text-sm font-semibold text-gray-900">
          {likeCount > 0 && (
            <span>
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </span>
          )}
          {likeCount > 0 && commentCount > 0 && <span className="mx-2">•</span>}
          {commentCount > 0 && (
            <button
              onClick={onComment}
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionBar;

