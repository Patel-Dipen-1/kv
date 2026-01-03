import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Video, Loader } from "lucide-react";
import { toast } from "react-toastify";

const MediaUpload = ({
  label = "Upload Media",
  accept = "image/*,video/*",
  maxSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  multiple = true,
  value = [], // Array of { url, type, file?, caption? }
  onChange,
  onError,
  allowedTypes = {
    images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    videos: ["video/mp4", "video/webm", "video/quicktime", "video/mov"],
  },
  showCaptions = false,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Validate file
  const validateFile = (file) => {
    const allAllowedTypes = [
      ...allowedTypes.images,
      ...allowedTypes.videos,
    ];

    // Check file type
    if (!allAllowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.images.join(", ")}, ${allowedTypes.videos.join(", ")}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      };
    }

    return { valid: true };
  };

  // Create preview URL for file
  const createPreview = (file) => {
    return new Promise((resolve, reject) => {
      // If file is already a URL (from existing data), use it directly
      if (typeof file === "string" || (file && file.url && !file.file)) {
        resolve({
          url: typeof file === "string" ? file : file.url,
          type: file.type || (typeof file === "string" ? "image" : "image"),
          file: null,
          name: file.name || "",
          size: file.size || 0,
          caption: file.caption || "",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          url: e.target.result,
          type: file.type.startsWith("image/") ? "image" : "video",
          file: file,
          name: file.name,
          size: file.size,
          caption: "",
        });
      };
      reader.onerror = reject;
      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        // For videos, create object URL
        const url = URL.createObjectURL(file);
        resolve({
          url: url,
          type: "video",
          file: file,
          name: file.name,
          size: file.size,
          caption: "",
        });
      }
    });
  };

  // Handle file selection
  const handleFiles = useCallback(
    async (files) => {
      const fileArray = Array.from(files);
      
      // Check max files limit
      if (value.length + fileArray.length > maxFiles) {
        const error = `Maximum ${maxFiles} files allowed. You already have ${value.length} file(s).`;
        toast.error(error);
        if (onError) onError(error);
        return;
      }

      setUploading(true);
      const newFiles = [];

      try {
        for (const file of fileArray) {
          const validation = validateFile(file);
          if (!validation.valid) {
            toast.error(validation.error);
            if (onError) onError(validation.error);
            continue;
          }

          const preview = await createPreview(file);
          newFiles.push(preview);
        }

        if (newFiles.length > 0) {
          const updatedValue = [...value, ...newFiles];
          onChange(updatedValue);
        }
      } catch (error) {
        console.error("Error processing files:", error);
        toast.error("Failed to process files");
        if (onError) onError("Failed to process files");
      } finally {
        setUploading(false);
      }
    },
    [value, maxFiles, maxSize, allowedTypes, onChange, onError]
  );

  // Handle file input change
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Remove file
  const handleRemove = (index) => {
    const updatedValue = value.filter((_, i) => i !== index);
    // Revoke object URL if it's a video
    if (value[index].type === "video" && value[index].url.startsWith("blob:")) {
      URL.revokeObjectURL(value[index].url);
    }
    onChange(updatedValue);
  };

  // Update caption
  const handleCaptionChange = (index, caption) => {
    const updatedValue = [...value];
    updatedValue[index] = { ...updatedValue[index], caption };
    onChange(updatedValue);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload media files"
        />

        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-gray-600">Processing files...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <Upload
                  className="text-gray-400"
                  size={48}
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Drag and drop files here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Images: JPG, PNG, WebP | Videos: MP4, WebM, MOV (Max {maxSize / 1024 / 1024}MB per file)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {value.map((item, index) => (
              <div
                key={index}
                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
              >
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 z-10 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Remove ${item.type}`}
                >
                  <X size={16} />
                </button>

                {/* Image Preview */}
                {item.type === "image" && (
                  <div className="aspect-square">
                    <img
                      src={item.url}
                      alt={item.caption || item.name || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Video Preview */}
                {item.type === "video" && (
                  <div className="aspect-square relative">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      aria-label={item.caption || item.name || `Video ${index + 1}`}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 flex items-center gap-1">
                      <Video size={12} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </div>
                )}

                {/* Caption Input */}
                {showCaptions && (
                  <div className="p-2">
                    <input
                      type="text"
                      value={item.caption || ""}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      placeholder="Add caption..."
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label="Image caption"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;

