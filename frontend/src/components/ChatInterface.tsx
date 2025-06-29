'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Loader2, 
  BarChart3, 
  MessageSquare,
  Sparkles
} from 'lucide-react'
import PlotlyChart from '@/components/PlotlyChart'

interface VisualizationData {
  filename: string
  data: any
  created_at: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  visualizations?: VisualizationData[]
  isStreaming?: boolean
}

interface ChatInterfaceProps {
  selectedFile: string
}

export default function ChatInterface({ selectedFile }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && selectedFile) {
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: `Hello! I'm ready to help you analyze your dataset "${selectedFile}". I can provide detailed analysis, answer questions about your data, and create visualizations.\n\nWhat would you like to explore?`
        }
      ])
    }
  }, [selectedFile, messages.length])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Simulate streaming effect for AI responses
  const simulateStreaming = (fullContent: string, messageId: string, visualizations?: VisualizationData[]) => {
    const words = fullContent.split(' ')
    let currentContent = ''
    let wordIndex = 0

    const streamInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentContent += (wordIndex > 0 ? ' ' : '') + words[wordIndex]
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: currentContent, isStreaming: true }
            : msg
        ))
        wordIndex++
      } else {
        clearInterval(streamInterval)
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: fullContent, 
                isStreaming: false, 
                visualizations: visualizations 
              }
            : msg
        ))
      }
    }, 30) // Faster streaming for better UX
  }

  // Handle sending a message to the AI
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim()
    }

    const assistantMessageId = (Date.now() + 1).toString()
    
    setMessages(prev => [...prev, userMessage, {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      isStreaming: true
    }])
    
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile,
          question: userMessage.content
        })
      })

      const result = await response.json()

      if (result.success) {
        // The result.answer now contains the full AI reasoning process including "I now have the final answer:"
        const content = result.answer || 'Analysis completed successfully.'
        simulateStreaming(content, assistantMessageId, result.visualizations)
      } else {
        const errorContent = `I apologize, but I encountered an error while analyzing your question. Please try rephrasing your question or check if the dataset is properly loaded.`
        simulateStreaming(errorContent, assistantMessageId)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorContent = `I apologize, but I'm having trouble connecting to the analysis service. Please check your connection and try again.`
      simulateStreaming(errorContent, assistantMessageId)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Format the AI response text to make it more readable
  const formatAIResponse = (content: string) => {
    // Split by common AI system messages and format them
    const sections = content.split(/(?=>>)/g)
    
    return sections.map((section, index) => {
      if (section.includes('>> Calling Model:')) {
        return (
          <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-r">
            <div className="text-sm font-medium text-blue-800">
              {section.trim()}
            </div>
          </div>
        )
      } else if (section.includes('>> I now have the final answer:')) {
        const parts = section.split('>> I now have the final answer:')
        return (
          <div key={index}>
            {parts[0] && (
              <div className="text-gray-700 mb-3 whitespace-pre-wrap">
                {parts[0].trim()}
              </div>
            )}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-3 rounded-r">
              <div className="text-sm font-medium text-green-800 mb-2">
                🎯 Final Answer:
              </div>
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {parts[1]?.trim()}
              </div>
            </div>
          </div>
        )
      } else if (section.includes('>>')) {
        return (
          <div key={index} className="bg-gray-50 border-l-4 border-gray-400 p-3 mb-3 rounded-r">
            <div className="text-sm text-gray-700">
              {section.trim()}
            </div>
          </div>
        )
      } else {
        return (
          <div key={index} className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-3">
            {section.trim()}
          </div>
        )
      }
    }).filter(Boolean)
  }

  return (
    <Card className="bg-white shadow-sm h-[700px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Sparkles className="h-5 w-5" />
          AI Analysis Chat
        </CardTitle>
        <p className="text-sm text-blue-600">
          Ask questions about your data and get detailed AI-powered insights
        </p>
      </CardHeader>
      
      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="space-y-4">
                {message.type === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-3xl bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm">
                      <div className="font-medium text-blue-100 text-xs mb-1">You</div>
                      <div className="leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-700 text-sm">AI Assistant</span>
                        {message.isStreaming && (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-sm border border-gray-200">
                        {message.content ? (
                          <div className="prose prose-sm max-w-none">
                            {formatAIResponse(message.content)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Analyzing your question...</span>
                          </div>
                        )}
                        
                        {message.isStreaming && message.content && (
                          <span className="inline-block w-2 h-5 bg-blue-600 ml-1 animate-pulse"></span>
                        )}
                      </div>
                      
                      {/* Visualizations */}
                      {message.visualizations && message.visualizations.length > 0 && (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                            <BarChart3 className="h-4 w-4" />
                            Generated Visualizations
                          </div>
                          {message.visualizations.map((viz, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                              <div className="p-3 bg-gray-50 border-b">
                                <h4 className="text-sm font-medium text-gray-800">{viz.filename}</h4>
                              </div>
                              <div className="p-2">
                                <PlotlyChart data={viz.data} height={400} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your data: patterns, insights, visualizations..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}