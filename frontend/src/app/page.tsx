'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Database, Upload, FileText, Plus, X, BarChart3 } from 'lucide-react'
import FileUpload from '@/components/FileUploader'
import ChatInterface from '@/components/ChatInterface'
import DataTable from '@/components/DataTable'

interface FileInfo {
  filename: string
  size: number
  upload_date: string
  rows?: number
  columns?: number
}

interface DatasetPreview {
  filename: string
  shape: [number, number]
  columns: string[]
  dtypes: Record<string, string>
  sample_data: Record<string, any>[]
  missing_values: Record<string, number>
}

export default function DataAnalysisDashboard() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [datasetPreview, setDatasetPreview] = useState<DatasetPreview | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/files/')
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }, [])

  const fetchDatasetPreview = useCallback(async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/dataset/${filename}`)
      if (response.ok) {
        const preview = await response.json()
        setDatasetPreview(preview)
      }
    } catch (error) {
      console.error('Error fetching dataset preview:', error)
    }
  }, [])

  const handleFileUploaded = useCallback(() => {
    fetchFiles()
    setShowUpload(false)
  }, [fetchFiles])

  const handleFileSelect = useCallback((filename: string) => {
    setSelectedFile(filename)
    fetchDatasetPreview(filename)
    setActiveTab('data')
  }, [fetchDatasetPreview])

  const handleDeleteFile = useCallback(async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/files/${filename}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchFiles()
        if (selectedFile === filename) {
          setSelectedFile('')
          setDatasetPreview(null)
          setActiveTab('overview')
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }, [fetchFiles, selectedFile])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">InsightAI</h1>
                  <p className="text-xs text-gray-500">AI-Powered Data Analysis</p>
                </div>
              </div>
              
              {selectedFile && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{selectedFile}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {files.length > 0 && (
                <select
                  value={selectedFile}
                  onChange={(e) => e.target.value && handleFileSelect(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select dataset...</option>
                  {files.map((file) => (
                    <option key={file.filename} value={file.filename}>
                      {file.filename}
                    </option>
                  ))}
                </select>
              )}
              
              <Button
                onClick={() => setShowUpload(!showUpload)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Upload Dataset</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpload(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <FileUpload onFileUploaded={handleFileUploaded} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!selectedFile ? (
          // Welcome State
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Brain className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to InsightAI</h2>
              <p className="text-lg text-gray-600 mb-8">
                Upload your dataset and start exploring your data with AI-powered analysis
              </p>
              
              {files.length === 0 ? (
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Your First Dataset
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">Select a dataset to get started:</p>
                  <div className="grid gap-3">
                    {files.map((file) => (
                      <Card
                        key={file.filename}
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                        onClick={() => handleFileSelect(file.filename)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-8 w-8 text-blue-600" />
                              <div className="text-left">
                                <h4 className="font-semibold text-gray-900">{file.filename}</h4>
                                <p className="text-sm text-gray-500">
                                  {file.rows?.toLocaleString()} rows • {file.columns} columns • {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFile(file.filename)
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Main Analysis Interface
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Database className="h-4 w-4 mr-2" />
                Data Table
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Brain className="h-4 w-4 mr-2" />
                AI Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {datasetPreview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Rows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {datasetPreview.shape[0].toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Columns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {datasetPreview.shape[1]}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Numeric Columns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.values(datasetPreview.dtypes).filter(dtype => 
                          dtype.includes('int') || dtype.includes('float')
                        ).length}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Missing Values</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {Object.values(datasetPreview.missing_values).reduce((sum, count) => sum + count, 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Column Information</CardTitle>
                  <CardDescription>Data types and missing values for each column</CardDescription>
                </CardHeader>
                <CardContent>
                  {datasetPreview && (
                    <div className="space-y-3">
                      {datasetPreview.columns.map((column, index) => {
                        const dtype = datasetPreview.dtypes[column]
                        const missingCount = datasetPreview.missing_values[column] || 0
                        const missingPercent = ((missingCount / datasetPreview.shape[0]) * 100).toFixed(1)
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <div>
                                <span className="font-medium text-gray-900">{column}</span>
                                <span className="ml-2 text-sm text-gray-500">({dtype})</span>
                              </div>
                            </div>
                            {missingCount > 0 && (
                              <span className="text-sm text-orange-600">
                                {missingCount} missing ({missingPercent}%)
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <DataTable datasetPreview={datasetPreview} />
            </TabsContent>

            <TabsContent value="chat">
              <ChatInterface selectedFile={selectedFile} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}