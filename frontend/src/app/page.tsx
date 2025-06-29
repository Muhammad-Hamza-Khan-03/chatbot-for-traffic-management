'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, BarChart3, Brain, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import FileUpload from '@/components/FileUploader'
import AnalysisResults from '@/components/AnalysisPanel'
import FileList from '@/components/FileSelector'
// import { useToast } from '@/components/ui/use-toast'

interface AnalysisResult {
  question: string
  answer: string
  code?: string
  results?: string
  visualizations: string[]
}

interface AnalysisResponse {
  summary: string
  results: AnalysisResult[]
  total_questions: number
  processing_time: number
  visualizations: any[]
  report_id: string
}

interface FileInfo {
  filename: string
  size: number
  upload_date: string
  rows?: number
  columns?: number
}

export default function Dashboard() {
  // State management for the application
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [customQuestion, setCustomQuestion] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  
  const { toast } = useToast()

  // Function to fetch the list of uploaded files from our backend
  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/files/')
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Failed to fetch files. Please check if the backend is running.",
        variant: "destructive"
      })
    }
  }, [toast])

  // Function to handle file upload completion
  const handleFileUploaded = useCallback(() => {
    fetchFiles() // Refresh the file list when a new file is uploaded
    toast({
      title: "Success",
      description: "File uploaded successfully! You can now analyze it.",
    })
  }, [fetchFiles, toast])

  // Main analysis function that communicates with our FastAPI backend
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to analyze first.",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResults(null)

    try {
      // Prepare the analysis request payload
      const requestData = {
        filename: selectedFile,
        question: customQuestion || undefined,
        num_questions: numQuestions
      }

      // Send analysis request to our FastAPI backend
      const response = await fetch('http://localhost:8000/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const results: AnalysisResponse = await response.json()
      setAnalysisResults(results)
      
      toast({
        title: "Analysis Complete",
        description: `Generated ${results.total_questions} insights in ${results.processing_time.toFixed(2)} seconds`,
      })
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: "Analysis Failed",
        description: "There was an error during analysis. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Function to handle file deletion
  const handleDeleteFile = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/files/${filename}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchFiles() // Refresh the file list
        if (selectedFile === filename) {
          setSelectedFile('') // Clear selection if deleted file was selected
        }
        toast({
          title: "File Deleted",
          description: `${filename} has been deleted successfully.`,
        })
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Delete Failed",
        description: "Could not delete the file. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header section with branding and main title */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">InsightAI Dashboard</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your data files and let our AI generate comprehensive insights with beautiful visualizations. 
            Perfect for exploring patterns, trends, and hidden relationships in your datasets.
          </p>
        </div>

        {/* Main content area organized in tabs for better user experience */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & Manage
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analyze Data
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Results
            </TabsTrigger>
          </TabsList>

          {/* File Upload and Management Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Management
                </CardTitle>
                <CardDescription>
                  Upload CSV or Excel files containing your data. The system supports various data formats and will automatically detect column types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* File upload component */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Upload New File</h3>
                    <FileUpload onFileUploaded={handleFileUploaded} />
                  </div>
                  
                  {/* File list component */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
                    <FileList 
                      files={files}
                      selectedFile={selectedFile}
                      onSelectFile={setSelectedFile}
                      onDeleteFile={handleDeleteFile}
                      onRefresh={fetchFiles}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Configuration Tab */}
          <TabsContent value="analyze" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configure Analysis</CardTitle>
                <CardDescription>
                  Customize your analysis by selecting a file and specifying your requirements. 
                  You can ask specific questions or let the AI generate comprehensive insights automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select File to Analyze</label>
                  <select 
                    value={selectedFile} 
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a file...</option>
                    {files.map((file) => (
                      <option key={file.filename} value={file.filename}>
                        {file.filename} ({file.rows} rows, {file.columns} columns)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom question input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Question (Optional)</label>
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="e.g., What are the main patterns in customer behavior? How do sales vary by region?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for comprehensive automatic analysis, or specify what you want to discover.
                  </p>
                </div>

                {/* Number of questions selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Analysis Questions</label>
                  <select 
                    value={numQuestions} 
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 - Quick Analysis</option>
                    <option value={3}>3 - Basic Insights</option>
                    <option value={5}>5 - Comprehensive Analysis</option>
                    <option value={7}>7 - Deep Dive</option>
                    <option value={10}>10 - Extensive Research</option>
                  </select>
                </div>

                {/* Analysis button */}
                <Button 
                  onClick={handleAnalyze} 
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Data...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-5 w-5" />
                      Start Analysis
                    </>
                  )}
                </Button>

                {/* Information alert about the analysis process */}
                <Alert>
                  <AlertDescription>
                    The AI will analyze your data and generate insights including statistical summaries, 
                    pattern detection, correlations, and interactive visualizations. This process typically takes 30-60 seconds depending on dataset size.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Display Tab */}
          <TabsContent value="results">
            {analysisResults ? (
              <AnalysisResults results={analysisResults} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analysis Results Yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Upload a file and run an analysis to see comprehensive insights and visualizations here. 
                    The results will include statistical summaries, trend analysis, and interactive charts.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
function useToast(): { toast: (options: { title: string, description?: string, variant?: string }) => void } {
  return {
    toast: ({ title, description, variant }) => {
      // You can enhance this to use a real toast/notification system.
      alert(`${variant === 'destructive' ? '[Error] ' : ''}${title}${description ? '\n' + description : ''}`)
    }
  }
}
