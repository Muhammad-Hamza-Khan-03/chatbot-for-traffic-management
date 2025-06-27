'use client';

import React, { JSX } from 'react';

// Import the FileInfo interface
interface FileInfo {
  filename: string;
  size: number;
  upload_date: string;
}

// Define the props interface for our FileSelector component
interface FileSelectorProps {
  files: FileInfo[];
  selectedFile: string | null;
  onFileSelect: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  onRefresh: () => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onDeleteFile,
  onRefresh
}) => {
  
  // Helper function to format file sizes in a human-readable way
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get an icon based on file extension
  const getFileIcon = (filename: string): JSX.Element => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      return (
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
          <path d="M6 7h8v2H6V7zm0 4h8v2H6v-2z"/>
        </svg>
      );
    } else {
      // Excel files (.xlsx, .xls)
      return (
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
          <path d="M7 7l2 3-2 3h2l1-2 1 2h2l-2-3 2-3h-2l-1 2-1-2H7z"/>
        </svg>
      );
    }
  };

  // Handler for when a user clicks on a file row
  const handleFileClick = (filename: string, event: React.MouseEvent) => {
    // Prevent event bubbling if the user clicked on the delete button
    if ((event.target as HTMLElement).closest('.delete-button')) {
      return;
    }
    onFileSelect(filename);
  };

  // Handler for the delete button click
  const handleDeleteClick = (filename: string, event: React.MouseEvent) => {
    // Stop the event from bubbling up to the file row click handler
    event.stopPropagation();
    onDeleteFile(filename);
  };

  return (
    <div className="space-y-4">
      {/* Header section with refresh button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-black">
          {files.length === 0 
            ? 'No files uploaded yet. Upload some files to get started!' 
            : `${files.length} file${files.length === 1 ? '' : 's'} available`
          }
        </p>
        
        {/* Refresh button with blue color scheme */}
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          title="Refresh file list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* File list container with white background */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {files.length === 0 ? (
          // Empty state with clean white background
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Upload your first file to begin analysis</p>
          </div>
        ) : (
          // File list with white background and proper color scheme
          files.map((file) => (
            <div
              key={file.filename}
              onClick={(e) => handleFileClick(file.filename, e)}
              className={`
                p-3 border rounded-lg cursor-pointer transition-all duration-200 bg-white
                ${selectedFile === file.filename
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {/* File row content using flexbox for layout */}
              <div className="flex items-center justify-between">
                {/* Left side: File icon and details */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* File type icon with proper color coding */}
                  {getFileIcon(file.filename)}
                  
                  {/* File information with black text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    
                    {/* File metadata in muted gray */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>Uploaded: {new Date(file.upload_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Action buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Selected indicator with green color */}
                  {selectedFile === file.filename && (
                    <span className="text-green-700 text-sm font-medium bg-green-100 px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                  
                  {/* Delete button with red hover state */}
                  <button
                    onClick={(e) => handleDeleteClick(file.filename, e)}
                    className="delete-button p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title={`Delete ${file.filename}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path 
                        fillRule="evenodd" 
                        d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 012 0v4a1 1 0 11-2 0V9zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V9z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected file summary with green success color */}
      {selectedFile && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-sm text-green-800">
              <span className="font-medium text-black">{selectedFile}</span> is ready for analysis
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSelector;