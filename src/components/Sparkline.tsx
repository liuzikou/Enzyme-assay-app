import React from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  onClick?: () => void
  isSelected?: boolean
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 40,
  color = '#2258cf',
  onClick,
  isSelected = false
}) => {
  // Convert array to chart data format
  const chartData = data.map((value, index) => ({
    time: index,
    value
  }))

  if (chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-gray-400 border rounded ${
          isSelected ? 'border-accent bg-accent/5' : 'border-gray-200'
        }`}
        style={{ width, height }}
        onClick={onClick}
      >
        No data
      </div>
    )
  }

  return (
    <div
      className={`cursor-pointer border rounded ${
        isSelected ? 'border-accent bg-accent/5' : 'border-gray-200'
      }`}
      style={{ width, height }}
      onClick={onClick}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2, fill: color }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-gray-200 rounded shadow-lg p-2 text-xs">
                    <p>Time: {payload[0].payload.time}</p>
                    <p>Value: {(payload[0].value as number)?.toFixed(3)}</p>
                  </div>
                )
              }
              return null
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 