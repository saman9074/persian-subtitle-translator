
import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
     // Reset the input value to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".srt,.vtt"
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="w-full flex items-center justify-center px-6 py-4 border-2 border-dashed border-sky-400 rounded-lg text-sky-600 dark:text-sky-300 dark:border-sky-500 hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-800/30 transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Upload subtitle file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-3" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 7.423l.386.766A6.75 6.75 0 016.75 19.5z" />
        </svg>
        <span className="text-lg font-medium">Click to upload .SRT or .VTT file</span>
      </button>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2" id="file-upload-description">
        Only .srt and .vtt files are supported.
      </p>
    </div>
  );
};

export default FileUpload;
