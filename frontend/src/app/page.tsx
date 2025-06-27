'use client';

import React, { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import FileSelector from '@/components/FileSelector';
import AnalysisPanel from '@/components/AnalysisPanel';
import VisualizationDisplay from '@/components/visualizationDisplay';

// Types for our data structures
export interface FileInfo {
  filename: string;
  size: number;
  upload_date: string;
}

export interface CodeBlock {
  type: string;
  content: string;
}

export interface VisualizationData {
  filename: string;
  data: any;
  created_at: string;
}

export interface AnalysisResult {
  success: boolean;
  result?: string;
  error?: string;
  code_blocks?: CodeBlock[];
  visualizations?: VisualizationData[];
}

const HomePage: React.FC = () => {
  // State management for files, selected file, and analysis results
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh the file list from the backend
  const refreshFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/files/');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      } else {
        console.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Load files when component mounts or when refresh is triggered
  useEffect(() => {
    refreshFiles();
  }, [refreshTrigger]);

  // Handler for successful file uploads
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  // Handler for file selection from the file selector
  const handleFileSelect = (filename: string) => {
    setSelectedFile(filename);
    setAnalysisResult(null); // Clear previous analysis results
  };

  // Handler for running analysis on selected file
  const handleAnalyze = async (question: string) => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('http://localhost:8000/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile,
          question: question,
        }),
      });

      if (response.ok) {
        const result: AnalysisResult = await response.json();
        setAnalysisResult(result);
      } else {
        const errorData = await response.json();
        setAnalysisResult({
          success: false,
          error: errorData.detail || 'Analysis failed',
        });
      }
    } catch (error) {
      setAnalysisResult({
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler for deleting files
  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/files/${filename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the file list and clear selection if deleted file was selected
        setRefreshTrigger(prev => prev + 1);
        if (selectedFile === filename) {
          setSelectedFile(null);
          setAnalysisResult(null);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete file: ${errorData.detail}`);
      }
    } catch (error) {
      alert(`Error deleting file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header section with title and description */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">
            AI Data Analysis Platform
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your CSV or Excel files and let our AI agent analyze your data, 
            generate insights, and create visualizations to help you understand your information better.
          </p>
        </div>

        {/* Main content grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - File management */}
          <div className="space-y-6">
            {/* File upload component */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Upload Files
              </h2>
              <FileUploader onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* File selector component */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Select File for Analysis
              </h2>
              <FileSelector
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onDeleteFile={handleDeleteFile}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
              />
            </div>
          </div>

          {/* Right column - Analysis panel */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-black mb-4">
              AI Analysis
            </h2>
            <AnalysisPanel
              selectedFile={selectedFile}
              onAnalyze={handleAnalyze}
              analysisResult={analysisResult}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>

        {/* Visualization Results Section */}
        {analysisResult && analysisResult.success && analysisResult.visualizations && analysisResult.visualizations.length > 0 && (
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Generated Visualizations
              </h2>
              <VisualizationDisplay visualizations={analysisResult.visualizations} />
            </div>
          </div>
        )}

        {/* Code Blocks Section */}
        {analysisResult && analysisResult.success && analysisResult.code_blocks && analysisResult.code_blocks.length > 0 && (
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Generated Code
              </h2>
              <div className="space-y-4">
                {analysisResult.code_blocks.map((codeBlock, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-700 uppercase">
                        {codeBlock.type}
                      </span>
                    </div>
                    <pre className="p-4 text-sm text-gray-800 overflow-x-auto">
                      <code>{codeBlock.content}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions Footer */}
        <div className="mt-12 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-black mb-3">
            How to Use This Platform
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <p>Upload your CSV or Excel files using the file uploader. The system accepts .csv, .xlsx, and .xls formats.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <p>Select a file from your uploaded files list. You can also delete files you no longer need.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <p>Ask a question about your data. The AI will analyze your data and provide insights with visualizations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;