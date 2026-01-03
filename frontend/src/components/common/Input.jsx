import React, { useState, useRef, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = forwardRef(({
  label,
  type = "text",
  name,
  register,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);
  const combinedRef = ref || inputRef;

  // Support both react-hook-form (register) and controlled components
  const inputProps = register
    ? { ...register(name) }
    : {
        value: value || "",
        onChange,
        onBlur,
      };

  // Determine input type
  const inputType =
    type === "password" && showPasswordToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

  // Handle password toggle
  const handleTogglePassword = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
    // Maintain cursor position
    if (inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart;
      setTimeout(() => {
        inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  };

  // Check if password toggle should be shown
  const shouldShowToggle = showPasswordToggle && type === "password";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type={inputType}
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300"
          } ${
            shouldShowToggle ? "pr-12" : ""
          } ${className}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${name}-error` : undefined}
          {...inputProps}
          {...props}
        />
        {shouldShowToggle && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;

