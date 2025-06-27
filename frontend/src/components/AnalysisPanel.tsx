'use client';

import React, { useState } from 'react';

// Define the structure for analysis results with enhanced data types
interface CodeBlock {
  type: string;
  content: string;
}

interface VisualizationData {
  filename: string;
  data: any;
  created_at: string;
}

interface AnalysisResult {
  success: boolean;
  result?: string;
  error?: string;
  code_blocks?: CodeBlock[];
  visualizations?: VisualizationData[];
}

// Props interface for the AnalysisPanel component
interface AnalysisPanelProps {
  selectedFile: string | null;
  onAnalyze: (question: string) => Promise<void>;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  selectedFile,
  onAnalyze,
  analysisResult,
  isAnalyzing
}) => {
  
  // Local state for managing the user's question input
  const [question, setQuestion] = useState<string>('');

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the default form submission behavior
    e.preventDefault();
    
    // Validate that we have both a file and a question
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    
    if (!question.trim()) {
      alert('Please enter a question about your data');
      return;
    }
    
    // Call the parent component's analysis function
    try {
      await onAnalyze(question.trim());
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* File selection status section */}
      <div className="text-center">
        {selectedFile ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Ready to analyze: {selectedFile}</span>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800">Please select a file from the list above to begin analysis</span>
            </div>
          </div>
        )}
      </div>

      {/* Main analysis form - simplified interface */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Question input section */}
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-black mb-2">
            Ask a question about your data:
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are the main trends in this data? Create visualizations showing key patterns. Summarize the important insights..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-black"
            disabled={isAnalyzing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific about what you want to know. The AI will automatically generate appropriate visualizations for your question.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!selectedFile || !question.trim() || isAnalyzing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Analyzing Data...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analyze Data</span>
            </>
          )}
        </button>
      </form>

      {/* Analysis results section */}
      {analysisResult && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-black mb-3">Analysis Results</h3>
          
          {analysisResult.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Analysis Complete!</h4>
                  <div className="text-green-800">
                    {analysisResult.result}
                  </div>
                  
                  {/* Show visualization and code block counts */}
                  <div className="mt-3 text-sm text-green-700">
                    {analysisResult.visualizations && analysisResult.visualizations.length > 0 && (
                      <p>✅ Generated {analysisResult.visualizations.length} visualization{analysisResult.visualizations.length !== 1 ? 's' : ''}</p>
                    )}
                    {analysisResult.code_blocks && analysisResult.code_blocks.length > 0 && (
                      <p>✅ Generated {analysisResult.code_blocks.length} code block{analysisResult.code_blocks.length !== 1 ? 's' : ''}</p>
                    )}
                    <p className="mt-2">
                      💡 Check the sections below for detailed visualizations and generated code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Analysis Failed</h4>
                  <p className="text-red-800">{analysisResult.error}</p>
                  <p className="text-sm text-red-700 mt-2">
                    Try checking if your file is properly formatted and your question is clear, then try again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state display */}
      {isAnalyzing && (
        <div className="border-t pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900">AI Analysis in Progress</h4>
                <p className="text-blue-800 text-sm">
                  Our AI agent is analyzing your data. This may take a few moments depending on the complexity of your dataset and question.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;