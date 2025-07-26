import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ChartJsSparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  onClick?: () => void
  isSelected?: boolean
  yDomain?: [number, number]
  xDomain?: number
}

export const ChartJsSparkline: React.FC<ChartJsSparklineProps> = ({
  data,
  width = 80,
  height = 40,
  color = '#2258cf',
  onClick,
  isSelected = false,
  yDomain = [0, 1],
  xDomain = 10
}) => {
  console.log('ChartJsSparkline data', data)

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-gray-400 border rounded ${
          isSelected ? 'border-accent bg-accent/5' : 'border-gray-200'
        }`}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          minHeight: `${height}px`,
          maxHeight: `${height}px`
        }}
        onClick={onClick}
      >
        No data
      </div>
    )
  }

  // Calculate Y-axis domain to ensure line starts from bottom
  const dataMin = Math.min(...data)
  const dataMax = Math.max(...data)
  const dataRange = dataMax - dataMin
  
  // If all values are the same, create a small range
  const effectiveRange = dataRange === 0 ? Math.max(0.1, dataMin * 0.1) : dataRange
  
  // Set Y-axis domain with padding to ensure line starts from bottom
  const padding = effectiveRange * 0.1 // 10% padding
  const chartYDomain = [
    dataMin - padding,
    dataMax + padding
  ]

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data: data,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 2,
        tension: 0.1, // Slight curve for smoother appearance
        fill: false
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#d1d5db',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: (context: any) => `Time: ${context[0].dataIndex}`,
          label: (context: any) => `Value: ${context.parsed.y.toFixed(3)}`
        }
      }
    },
    scales: {
      x: {
        display: false,
        min: 0,
        max: data.length - 1,
        grid: {
          display: false
        }
      },
      y: {
        display: false,
        min: chartYDomain[0],
        max: chartYDomain[1],
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      point: {
        hoverRadius: 2
      }
    }
  }

  return (
    <div
      className={`cursor-pointer border rounded bg-white flex-shrink-0 ${
        isSelected ? 'border-accent bg-accent/5' : 'border-gray-200'
      }`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        minHeight: `${height}px`,
        maxHeight: `${height}px`
      }}
      onClick={onClick}
    >
      <Line data={chartData} options={options} />
    </div>
  )
} 