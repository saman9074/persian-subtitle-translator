
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 p-6 text-center mt-auto">
      <div className="container mx-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} Subtitle Translator. Powered by Gemini API.</p>
        <p className="text-xs mt-1 opacity-70">
          This is a demonstration application. Ensure compliance with API terms of service.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
