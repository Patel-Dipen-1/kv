import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Helper function to extract YouTube video ID
const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return {
        videoId: match[1],
        isLive: url.includes("/live/"),
      };
    }
  }
  return null;
};

const MediaCarousel = ({ 
  images = [], 
  videos = [], 
  youtubeUrls = [],
  externalLinks = [],
  onImageClick, 
  className = "" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const containerRef = useRef(null);

  // Normalize media data - handle both string URLs and objects
  const allMedia = React.useMemo(() => {
    const normalizedImages = (images || []).map((img) => {
      if (typeof img === "string") {
        return { type: "image", url: img, caption: "" };
      }
      return {
        type: "image",
        url: img?.url || img || "",
        caption: img?.caption || "",
      };
    }).filter(img => img.url); // Filter out empty URLs

    const normalizedVideos = (videos || []).map((vid) => {
      if (typeof vid === "string") {
        return { type: "video", url: vid, caption: "" };
      }
      return {
        type: "video",
        url: vid?.url || vid || "",
        caption: vid?.caption || "",
      };
    }).filter(vid => vid.url); // Filter out empty URLs

    // Normalize YouTube URLs
    const normalizedYouTube = (youtubeUrls || []).map((ytUrl) => {
      const url = typeof ytUrl === "string" ? ytUrl : ytUrl?.url || ytUrl;
      const youtubeData = extractYouTubeVideoId(url);
      if (youtubeData) {
        return {
          type: "youtube",
          url: url,
          videoId: youtubeData.videoId,
          isLive: youtubeData.isLive,
          embedUrl: `https://www.youtube.com/embed/${youtubeData.videoId}${youtubeData.isLive ? "?autoplay=1" : ""}`,
          caption: typeof ytUrl === "object" ? ytUrl?.caption || "" : "",
        };
      }
      return null;
    }).filter(item => item !== null);

    // Normalize external links
    const normalizedLinks = (externalLinks || []).map((link) => {
      if (typeof link === "string") {
        return { type: "link", url: link, title: "", description: "" };
      }
      return {
        type: "link",
        url: link?.url || link || "",
        title: link?.title || "",
        description: link?.description || "",
      };
    }).filter(link => link.url); // Filter out empty URLs

    return [...normalizedImages, ...normalizedVideos, ...normalizedYouTube, ...normalizedLinks];
  }, [images, videos, youtubeUrls, externalLinks]);

  // Reset index when media array changes
  useEffect(() => {
    if (allMedia.length > 0 && currentIndex >= allMedia.length) {
      setCurrentIndex(0);
    } else if (allMedia.length === 0) {
      setCurrentIndex(0);
    }
  }, [allMedia.length]);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const openFullscreen = (media) => {
    if (media.type === "image") {
      setFullscreenImage(media);
      setIsFullscreen(true);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setFullscreenImage(null);
  };

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFullscreen) {
        if (e.key === "Escape") {
          closeFullscreen();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, allMedia.length]);

  if (allMedia.length === 0) return null;

  // Ensure currentIndex is valid
  const safeIndex = Math.max(0, Math.min(currentIndex, allMedia.length - 1));
  const currentMedia = allMedia[safeIndex];

  if (!currentMedia) return null;

  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full bg-black ${className}`}
        style={{ aspectRatio: "1 / 1" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentMedia.type === "image" ? (
          <img
            key={`image-${safeIndex}-${currentMedia.url}`}
            src={currentMedia.url}
            alt={currentMedia.caption || "Event media"}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => openFullscreen(currentMedia)}
            loading="lazy"
            onError={(e) => {
              console.error("Failed to load image:", currentMedia.url);
              e.target.style.display = "none";
            }}
          />
        ) : currentMedia.type === "youtube" ? (
          <div className="w-full h-full bg-black">
            <iframe
              key={`youtube-${safeIndex}-${currentMedia.videoId}`}
              src={currentMedia.embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={`YouTube video ${currentMedia.videoId}`}
              frameBorder="0"
            />
          </div>
        ) : currentMedia.type === "link" ? (
          <a
            key={`link-${safeIndex}-${currentMedia.url}`}
            href={currentMedia.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 hover:from-blue-600 hover:to-purple-700 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {currentMedia.title && (
                <h3 className="text-xl font-bold mb-2">{currentMedia.title}</h3>
              )}
              {currentMedia.description && (
                <p className="text-sm opacity-90 mb-4">{currentMedia.description}</p>
              )}
              <span className="text-sm underline">Open Link →</span>
            </div>
          </a>
        ) : (
          <video
            key={`video-${safeIndex}-${currentMedia.url}`}
            src={currentMedia.url}
            className="w-full h-full object-contain"
            controls
            playsInline
            preload="metadata"
            onError={(e) => {
              console.error("Failed to load video:", currentMedia.url);
            }}
          />
        )}

        {/* Navigation Dots and Page Indicator */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-20">
            {/* Page Counter - Always visible */}
            <div className="bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/20">
              {safeIndex + 1} / {allMedia.length}
            </div>
            {/* Dots */}
            <div className="flex gap-2">
              {allMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === safeIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to media ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10"
              aria-label="Previous media"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10"
              aria-label="Next media"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2"
            aria-label="Close fullscreen"
          >
            <X size={32} />
          </button>
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.caption || "Event image"}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default MediaCarousel;

