
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  text?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, text }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full my-4">
      {text && <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{text}</p>}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-sky-400 to-indigo-500 h-4 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
      <p className="text-right text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
        {Math.round(clampedProgress)}%
      </p>
    </div>
  );
};

export default ProgressBar;
