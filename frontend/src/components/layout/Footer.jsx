import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Family Community. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

