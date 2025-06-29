'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Database, 
  Columns, 
  HardDrive,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react'

// Interface that matches the file information structure from our FastAPI backend
interface FileInfo {
  filename: string
  size: number
  upload_date: string
  rows?: number
  columns?: number
}

interface FileListProps {
  files: FileInfo[]
  selectedFile: string
  onSelectFile: (filename: string) => void
  onDeleteFile: (filename: string) => void
  onRefresh: () => void
}

// Helper function to format file sizes in a human-readable way
// This makes technical information more accessible to users
function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const formattedSize = Math.round(bytes / Math.pow(1024, i) * 100) / 100
  
  return `${formattedSize} ${sizes[i]}`
}

// Helper function to format dates in a user-friendly format
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Show relative time for recent files, absolute date for older ones
  if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Helper function to determine file type icon based on filename extension
function getFileIcon(filename: string) {
  const extension = filename.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'csv':
      return <FileText className="h-5 w-5 text-green-600" />
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet className="h-5 w-5 text-blue-600" />
    default:
      return <FileText className="h-5 w-5 text-gray-600" />
  }
}

// Individual file item component that displays comprehensive file information
function FileItem({ file, isSelected, onSelect, onDelete }: {
  file: FileInfo
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle file deletion with confirmation and loading state
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className={`cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
        : 'hover:shadow-md hover:border-gray-300'
    }`}>
      <CardContent className="p-4">
        {/* File header with icon, name, and selection indicator */}
        <div className="flex items-center justify-between mb-3" onClick={onSelect}>
          <div className="flex items-center gap-3 flex-1">
            {getFileIcon(file.filename)}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {file.filename}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {formatDate(file.upload_date)}
              </p>
            </div>
            {isSelected && (
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* File metadata display - shows the structure of the data */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          {file.rows !== undefined && (
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {file.rows.toLocaleString()} rows
              </span>
            </div>
          )}
          
          {file.columns !== undefined && (
            <div className="flex items-center gap-2">
              <Columns className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {file.columns} columns
              </span>
            </div>
          )}
        </div>

        {/* File type badge for quick identification */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {file.filename.split('.').pop()?.toUpperCase() || 'Unknown'}
          </Badge>
          
          {/* Delete button with loading state */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation() // Prevent file selection when clicking delete
              handleDelete()
            }}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main FileList component that orchestrates the file management interface
export default function FileList({ 
  files, 
  selectedFile, 
  onSelectFile, 
  onDeleteFile, 
  onRefresh 
}: FileListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle refresh with loading state for better user experience
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate total storage used by all files
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const totalFiles = files.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              File Library
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {totalFiles} files • {formatFileSize(totalSize)} total
            </p>
          </div>
          
          {/* Refresh button to reload the file list */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {files.length === 0 ? (
          // Empty state when no files have been uploaded yet
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Upload your first data file to get started with AI-powered analysis. 
              Supported formats include CSV and Excel files.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Instructions for file selection */}
            <Alert>
              <AlertDescription>
                Click on a file to select it for analysis. Selected files are highlighted in blue.
                You can delete files you no longer need using the trash icon.
              </AlertDescription>
            </Alert>
            
            {/* Grid of file items - responsive layout that adapts to screen size */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {files.map((file) => (
                <FileItem
                  key={file.filename}
                  file={file}
                  isSelected={selectedFile === file.filename}
                  onSelect={() => onSelectFile(file.filename)}
                  onDelete={() => onDeleteFile(file.filename)}
                />
              ))}
            </div>
            
            {/* Summary statistics at the bottom */}
            {files.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Library Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Files:</span>
                    <span className="ml-2 font-medium">{totalFiles}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Size:</span>
                    <span className="ml-2 font-medium">{formatFileSize(totalSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CSV Files:</span>
                    <span className="ml-2 font-medium">
                      {files.filter(f => f.filename.toLowerCase().endsWith('.csv')).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Excel Files:</span>
                    <span className="ml-2 font-medium">
                      {files.filter(f => f.filename.toLowerCase().match(/\.(xlsx|xls)$/)).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}