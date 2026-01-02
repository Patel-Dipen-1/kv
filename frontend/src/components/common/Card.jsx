import React from "react";

const Card = ({ children, className = "", padding = true }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md ${
        padding ? "p-4 md:p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;

