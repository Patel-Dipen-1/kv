import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { replyToComment } from "./commentSlice";
import Button from "../../components/common/Button";
import { MessageCircle, X } from "lucide-react";
import { toast } from "react-toastify";

const CommentReply = ({ parentCommentId, eventId, onReplyPosted }) => {
  const dispatch = useDispatch();
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(
      replyToComment({
        commentId: parentCommentId,
        replyData: {
          commentText: replyText.trim(),
        },
      })
    );

    setIsSubmitting(false);

    if (replyToComment.fulfilled.match(result)) {
      setReplyText("");
      toast.success("Reply posted successfully");
      if (onReplyPosted) onReplyPosted();
    } else {
      toast.error(result.payload || "Failed to post reply");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        maxLength={500}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setReplyText("");
            if (onReplyPosted) onReplyPosted();
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!replyText.trim()}
          className="flex items-center gap-2"
        >
          <MessageCircle size={16} />
          Reply
        </Button>
      </div>
    </form>
  );
};

export default CommentReply;

