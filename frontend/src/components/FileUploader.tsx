'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FileUploadProps {
  onFileUploaded: () => void
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  message: string
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  })

  // Function to handle the actual file upload process
  const uploadFile = async (file: File) => {
    setUploadStatus({ status: 'uploading', progress: 0, message: 'Preparing upload...' })

    try {
      // Create FormData object to send the file to our FastAPI backend
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress updates during upload (in a real application, you might use XMLHttpRequest for actual progress tracking)
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
          message: `Uploading ${file.name}...`
        }))
      }, 200)

      // Send the file to our FastAPI backend endpoint
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (response.ok) {
        const result = await response.json()
        setUploadStatus({
          status: 'success',
          progress: 100,
          message: `Successfully uploaded ${file.name}. File contains ${result.rows || 'unknown'} rows and ${result.columns || 'unknown'} columns.`
        })
        
        // Notify parent component that upload is complete
        onFileUploaded()
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setUploadStatus({ status: 'idle', progress: 0, message: '' })
        }, 3000)
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }
    } catch (error) {
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      
      // Reset error status after 5 seconds
      setTimeout(() => {
        setUploadStatus({ status: 'idle', progress: 0, message: '' })
      }, 5000)
    }
  }

  // Configure the dropzone with file validation and upload handling
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files (wrong type, too large, etc.)
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: `File rejected: ${rejection.errors[0]?.message || 'Invalid file'}`
      })
      return
    }

    // Process the first accepted file (we only allow one file at a time for this demo)
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0])
    }
  }, [])

  // Set up the dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 50 * 1024 * 1024, // 50MB max file size
    multiple: false // Only allow one file at a time
  })

  // Determine the appropriate styling based on current state
  const getDropzoneClasses = () => {
    const baseClasses = "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200"
    
    if (uploadStatus.status === 'uploading') {
      return `${baseClasses} border-blue-300 bg-blue-50`
    }
    
    if (uploadStatus.status === 'success') {
      return `${baseClasses} border-green-300 bg-green-50`
    }
    
    if (uploadStatus.status === 'error') {
      return `${baseClasses} border-red-300 bg-red-50`
    }
    
    if (isDragActive) {
      return `${baseClasses} border-blue-400 bg-blue-50 scale-105`
    }
    
    return `${baseClasses} border-gray-300 hover:border-blue-400 hover:bg-blue-50`
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Main dropzone area */}
        <div {...getRootProps()} className={getDropzoneClasses()}>
          <input {...getInputProps()} />
          
          {/* Dynamic content based on upload status */}
          {uploadStatus.status === 'uploading' ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
              <div>
                <p className="text-lg font-medium text-gray-700">{uploadStatus.message}</p>
                <Progress value={uploadStatus.progress} className="mt-2" />
              </div>
            </div>
          ) : uploadStatus.status === 'success' ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-lg font-medium text-green-700">{uploadStatus.message}</p>
            </div>
          ) : uploadStatus.status === 'error' ? (
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <p className="text-lg font-medium text-red-700">{uploadStatus.message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive ? 'Drop your file here!' : 'Drag & drop your data file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse files
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                <File className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>
          )}
        </div>

        {/* Helpful information about supported file types */}
        {uploadStatus.status === 'idle' && (
          <Alert className="mt-4">
            <AlertDescription>
              Supported formats: CSV (.csv), Excel (.xlsx, .xls). Maximum file size: 50MB. 
              Your data should have column headers in the first row for the best analysis results.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}