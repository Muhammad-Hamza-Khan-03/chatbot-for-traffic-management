"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PlotlyChartProps {
  data: any
  height?: number
  className?: string
}

export default function PlotlyChart({ data, height = 400, className = "" }: PlotlyChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [isPlotlyLoaded, setIsPlotlyLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    const loadPlotly = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).Plotly) {
          setIsPlotlyLoaded(true)
          return
        }

        const Plotly = await import("plotly.js-dist-min")
        ;(window as any).Plotly = Plotly.default || Plotly
        setIsPlotlyLoaded(true)
      } catch (err) {
        console.error("Failed to load Plotly:", err)
        setError("Failed to load charting library.")
      }
    }

    loadPlotly()
  }, [])

  useEffect(() => {
    if (!isPlotlyLoaded || !data || !plotRef.current) return

    const renderChart = async () => {
      setIsRendering(true)
      setError(null)

      try {
        const Plotly = (window as any).Plotly
        Plotly.purge(plotRef.current)

        const plotData = data.data || []
        const plotLayout = {
          ...data.layout,
          height: height,
          margin: { t: 50, r: 50, b: 50, l: 50 },
          responsive: true,
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#e5e7eb" },
        }

        const plotConfig = {
          displayModeBar: true,
          modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
          responsive: true,
          displaylogo: false,
        }

        await Plotly.newPlot(plotRef.current, plotData, plotLayout, plotConfig)

        const resizeObserver = new ResizeObserver(() => {
          if (plotRef.current) {
            Plotly.Plots.resize(plotRef.current)
          }
        })

        if (plotRef.current && plotRef.current.parentElement) {
          resizeObserver.observe(plotRef.current.parentElement)
        }
        ;(plotRef.current as any)._resizeObserver = resizeObserver
      } catch (err) {
        console.error("Error rendering chart:", err)
        setError("Failed to render chart.")
      } finally {
        setIsRendering(false)
      }
    }

    renderChart()

    return () => {
      if (plotRef.current && (plotRef.current as any)._resizeObserver) {
        ;(plotRef.current as any)._resizeObserver.disconnect()
      }
    }
  }, [isPlotlyLoaded, data, height])

  if (!isPlotlyLoaded) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <Alert className="max-w-md bg-red-900/20 border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-500">No chart data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="relative">
        {isRendering && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-10 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Rendering chart...</p>
            </div>
          </div>
        )}

        <div ref={plotRef} style={{ height, width: "100%" }} className="plotly-chart-container rounded" />
      </div>
    </div>
  )
}
