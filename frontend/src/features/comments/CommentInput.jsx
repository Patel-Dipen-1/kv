import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createComment } from "./commentSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { MessageCircle, Image as ImageIcon, X } from "lucide-react";
import { toast } from "react-toastify";

const CommentInput = ({ eventId, eventType, onCommentPosted }) => {
  const dispatch = useDispatch();
  const [commentText, setCommentText] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPlaceholder = () => {
    if (eventType === "funeral" || eventType === "condolence") {
      return "Share your condolence message...";
    }
    if (eventType === "marriage" || eventType === "birthday" || eventType === "anniversary") {
      return "Share your wishes and congratulations...";
    }
    return "Write a comment...";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setAttachedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(
      createComment({
        eventId,
        commentData: {
          commentText: commentText.trim(),
          attachedImage,
        },
      })
    );

    setIsSubmitting(false);

    if (createComment.fulfilled.match(result)) {
      setCommentText("");
      setAttachedImage(null);
      setImagePreview(null);
      toast.success("Comment posted successfully");
      if (onCommentPosted) onCommentPosted();
    } else {
      toast.error(result.payload || "Failed to post comment");
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={getPlaceholder()}
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {commentText.length}/1000 characters
            </span>
          </div>
        </div>

        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-xs rounded-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <ImageIcon size={18} />
            <span>Attach Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!commentText.trim()}
            className="flex items-center gap-2"
          >
            <MessageCircle size={18} />
            Post Comment
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CommentInput;

