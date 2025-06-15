
import React from 'react';
import { SubtitleEntry } from '../types';

interface SubtitleDisplayProps {
  subtitles: SubtitleEntry[];
  originalFileName?: string;
}

const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({ subtitles, originalFileName }) => {
  if (!subtitles || subtitles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0A2.25 2.25 0 0 1 3.75 7.5h16.5a2.25 2.25 0 0 1 2.25 2.25m-18.75 0h18.75c.621 0 1.125.504 1.125 1.125v.15c0 .507-.334.963-.806 1.091L3.806 13.409A1.125 1.125 0 0 1 2.625 12.28v-.15c0-.621.504-1.125 1.125-1.125Z" />
        </svg>
        No subtitles to display. Upload an SRT file to begin.
        {originalFileName && <p className="mt-1 text-xs">File: {originalFileName}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {originalFileName && (
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Subtitles for: <span className="font-mono text-indigo-600 dark:text-indigo-400">{originalFileName}</span>
        </h3>
      )}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-1">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 w-16 sm:w-20">ID</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 w-32 sm:w-40">Timecode</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Original Text</th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Persian Translation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {subtitles.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{entry.id}</td>
                <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-mono">{entry.startTime} &rarr; {entry.endTime}</td>
                <td className="px-3 py-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <div className="whitespace-pre-wrap break-words min-w-[200px] max-w-md">{entry.text}</div>
                </td>
                <td className="px-3 py-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {entry.translatedText ? (
                    <div dir="rtl" lang="fa" className="whitespace-pre-wrap break-words min-w-[200px] max-w-md font-['Vazirmatn',_sans-serif]"> {/* Assuming Vazirmatn or similar Persian font might be available or fallbacks used */}
                      {entry.translatedText}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 italic">Translating...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubtitleDisplay;
