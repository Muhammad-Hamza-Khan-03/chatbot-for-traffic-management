'use client';

import React, { useState, useRef } from 'react';

// Define the props interface for the FileUploader component
interface FileUploaderProps {
  onUploadSuccess: () => void; // Callback function to notify parent when upload succeeds
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  // State management for the upload process
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // useRef allows us to directly access the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for when user selects a file through the file input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      // Validate file type by checking the file extension
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        setSelectedFile(file);
        setMessage('');
        setMessageType('');
        setUploadProgress(0);
      } else {
        // Red error message for invalid file types
        setMessage('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
        setMessageType('error');
        setSelectedFile(null);
        // Clear the input so user can select a different file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Function to handle the actual file upload process
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }

    // Set upload state to show loading indicator
    setIsUploading(true);
    setUploadProgress(0);
    setMessage('');

    try {
      // Create FormData object to package the file for upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress for better user experience
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Make the API call to upload the file
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      });

      // Clear the progress simulation
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        // Parse the successful response from the server
        const result = await response.json();
        setMessage(`✅ ${result.message}`);
        setMessageType('success');
        
        // Reset the form state after successful upload
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Notify the parent component that upload was successful
        onUploadSuccess();
      } else {
        // Handle server errors with red error message
        const errorData = await response.json();
        setMessage(`❌ Upload failed: ${errorData.detail}`);
        setMessageType('error');
      }
    } catch (error) {
      // Handle network errors with red error message
      setMessage(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      // Always reset the uploading state
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Function to clear the selected file and reset the form
  const handleClear = () => {
    setSelectedFile(null);
    setMessage('');
    setMessageType('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper function to format file size in a human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* File input section with clean white background design */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-white">
        <div className="space-y-4">
          {/* File input element - hidden but accessible */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          {/* Visual file upload trigger */}
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm text-black">
              Click to select file or drag and drop
            </span>
            <span className="text-xs text-gray-500">
              CSV, XLSX, XLS files only
            </span>
          </label>
        </div>
      </div>

      {/* Display selected file information */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p className="font-medium text-black">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isUploading}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload progress bar with blue progress color */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-black">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action buttons with blue primary color */}
      <div className="flex space-x-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
        
        {selectedFile && (
          <button
            onClick={handleClear}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status message display with proper color coding */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FileUploader;