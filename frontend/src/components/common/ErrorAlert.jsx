import React from "react";
import { X } from "lucide-react";

const ErrorAlert = ({ message, onDismiss, className = "" }) => {
  if (!message) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between ${className}`}
      role="alert"
    >
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-red-600 hover:text-red-800 focus:outline-none"
          aria-label="Dismiss error"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;

