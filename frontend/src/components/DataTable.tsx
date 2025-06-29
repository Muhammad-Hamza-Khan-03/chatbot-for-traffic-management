'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search,
  Filter,
  Download
} from 'lucide-react'

interface DatasetPreview {
  filename: string
  shape: [number, number]
  columns: string[]
  dtypes: Record<string, string>
  sample_data: Record<string, any>[]
  missing_values: Record<string, number>
}

interface DataTableProps {
  datasetPreview: DatasetPreview | null
}

export default function DataTable({ datasetPreview }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const rowsPerPage = 20000

  if (!datasetPreview) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">Select a dataset to view its contents in table format</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get all available data (in a real app, this would be paginated from the backend)
  const allData = datasetPreview.sample_data
  const totalRows = datasetPreview.shape[0]
  const totalPages = Math.ceil(allData.length / rowsPerPage)

  // Filter data based on search term
  const filteredData = allData.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Get current page data
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  // Get displayed columns (all columns if none selected)
  const displayColumns = selectedColumns.length > 0 ? selectedColumns : datasetPreview.columns

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">—</span>
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    const strValue = String(value)
    if (strValue.length > 50) {
      return (
        <span title={strValue}>
          {strValue.substring(0, 50)}...
        </span>
      )
    }
    return strValue
  }

  const getColumnTypeColor = (dtype: string) => {
    if (dtype.includes('int') || dtype.includes('float')) {
      return 'bg-blue-100 text-blue-700'
    }
    if (dtype.includes('object') || dtype.includes('str')) {
      return 'bg-green-100 text-green-700'
    }
    if (dtype.includes('datetime')) {
      return 'bg-purple-100 text-purple-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5 text-blue-600" />
                Dataset Table View
              </CardTitle>
              <CardDescription>
                Showing {currentData.length} of {filteredData.length} rows 
                {filteredData.length !== allData.length && ` (filtered from ${allData.length})`}
                {allData.length < totalRows && ` • Dataset has ${totalRows.toLocaleString()} total rows`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Column Type Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Data Types:</span>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Numeric</Badge>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Text</Badge>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">DateTime</Badge>
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Other</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="min-w-full">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      #
                    </th>
                    {displayColumns.map((column) => {
                      const dtype = datasetPreview.dtypes[column]
                      const missingCount = datasetPreview.missing_values[column] || 0
                      
                      return (
                        <th 
                          key={column} 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-32" title={column}>
                                {column}
                              </span>
                              <Badge className={`text-xs ${getColumnTypeColor(dtype)}`}>
                                {dtype.split('64')[0]} {/* Simplified type display */}
                              </Badge>
                            </div>
                            {missingCount > 0 && (
                              <div className="text-xs text-orange-600">
                                {missingCount} missing
                              </div>
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {startIndex + index + 1}
                      </td>
                      {displayColumns.map((column) => (
                        <td key={column} className="px-4 py-3 text-sm text-gray-900 max-w-48">
                          {formatCellValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {currentData.length === 0 && (
                    <tr>
                      <td colSpan={displayColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                        {searchTerm ? 'No data matches your search criteria' : 'No data available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredData.length > rowsPerPage && (
        <Card className="bg-white shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} rows
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}