'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronUp, Code, Eye, BarChart3, Download, Clock, FileText } from 'lucide-react'
import PlotlyChart from './PlotlyChart'

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

interface AnalysisResultsProps {
  results: AnalysisResponse
}

function AnalysisInsight({ insight, index }: { insight: AnalysisResult; index: number }) {
  const [showCode, setShowCode] = useState(false)
  const [showResults, setShowResults] = useState(false)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Badge variant="outline">Question {index + 1}</Badge>
            {insight.question}
          </span>
          <Badge variant="secondary">{insight.visualizations.length} charts</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* The main answer section - this is the primary insight from insightai */}
        <div className="prose max-w-none">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Analysis Insight</h4>
          <p className="text-gray-700 leading-relaxed">{insight.answer}</p>
        </div>

        {/* Code section - collapsible to keep the interface clean */}
        {insight.code && (
          <Collapsible open={showCode} onOpenChange={setShowCode}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  View Generated Code
                </span>
                {showCode ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <ScrollArea className="h-64 w-full rounded-md border bg-gray-50 p-4">
                <pre className="text-sm">
                  <code className="language-python">{insight.code}</code>
                </pre>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Results section - contains detailed output from code execution */}
        {insight.results && (
          <Collapsible open={showResults} onOpenChange={setShowResults}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View Detailed Results
                </span>
                {showResults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <pre className="text-sm whitespace-pre-wrap text-gray-700">{insight.results}</pre>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

// Main component that orchestrates the display of all analysis results
export default function AnalysisResults({ results }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Function to download the full analysis report
  const downloadReport = () => {
    // Create a comprehensive text report from the analysis results
    const reportContent = `
# Data Analysis Report
Report ID: ${results.report_id}
Generated on: ${new Date().toLocaleString()}
Processing Time: ${results.processing_time.toFixed(2)} seconds

## Summary
${results.summary}

## Analysis Insights (${results.total_questions} questions)

${results.results.map((insight, index) => `
### Question ${index + 1}: ${insight.question}

**Answer:**
${insight.answer}

${insight.code ? `**Generated Code:**
\`\`\`python
${insight.code}
\`\`\`

` : ''}${insight.results ? `**Detailed Results:**
${insight.results}

` : ''}---
`).join('')}

## Visualizations
${results.visualizations.length} interactive charts were generated during this analysis.
    `.trim()

    // Create and trigger download
    const blob = new Blob([reportContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-report-${results.report_id}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Summary header with key metrics and actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-900">Analysis Complete</CardTitle>
              <CardDescription className="text-blue-700 mt-2">
                {results.summary}
              </CardDescription>
            </div>
            <Button onClick={downloadReport} className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Key metrics display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Questions Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">{results.total_questions}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Visualizations</p>
                <p className="text-2xl font-bold text-gray-900">{results.visualizations.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">{results.processing_time.toFixed(1)}s</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content area organized in tabs for better navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Detailed Insights</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
        </TabsList>

        {/* Overview tab - high-level summary */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Overview</CardTitle>
              <CardDescription>
                This analysis examined your dataset through {results.total_questions} different analytical lenses, 
                generating insights and visualizations to help you understand patterns and relationships in your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.results.map((insight, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{insight.question}</h4>
                    <p className="text-gray-600 mt-1">{insight.answer.substring(0, 200)}...</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed insights tab - full analysis results */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-6">
            {results.results.map((insight, index) => (
              <AnalysisInsight 
                key={index} 
                insight={insight} 
                index={index} 
              />
            ))}
          </div>
        </TabsContent>

        {/* Visualizations tab - all charts in one place */}
        <TabsContent value="visualizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Interactive Visualizations
              </CardTitle>
              <CardDescription>
                Explore the data through interactive charts generated during the analysis. 
                Each visualization reveals different aspects of your dataset's patterns and relationships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.visualizations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {results.visualizations.map((viz, index) => (
                    <Card key={index} className="p-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{viz.title}</CardTitle>
                        <Badge variant="outline">{viz.type}</Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        <PlotlyChart data={viz.data} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No visualizations were generated for this analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}