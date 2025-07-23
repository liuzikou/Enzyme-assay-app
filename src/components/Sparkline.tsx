import React from 'react'
import { LineChart, Line, Tooltip, YAxis, XAxis } from 'recharts'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  onClick?: () => void
  isSelected?: boolean
  yDomain?: [number, number]
  xDomain?: number
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 40,
  color = '#2258cf',
  onClick,
  isSelected = false,
  yDomain = [0, 1],
  xDomain = 10
}) => {
  console.log('Sparkline data', data)
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
      className={`cursor-pointer border rounded bg-white ${
        isSelected ? 'border-accent bg-accent/5' : 'border-gray-200'
      }`}
      style={{ width, height }}
      onClick={onClick}
    >
      <LineChart width={width} height={height} data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
        <XAxis dataKey="time" type="number" domain={xDomain ? [0, xDomain] : [0, 1]} hide={false} tick={false} axisLine={false} />
        <YAxis domain={yDomain} hide={false} tick={false} axisLine={false} />
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
    </div>
  )
} 