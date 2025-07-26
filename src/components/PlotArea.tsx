import React from 'react'
import { ChartJsSparkline } from './ChartJsSparkline'
import { useAssayStore } from '../features/hooks'

export const PlotArea: React.FC = () => {
  const { rawData, selectedWells, results } = useAssayStore()

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const cols = Array.from({ length: 12 }, (_, i) => i + 1)

  const getWellData = (wellId: string) => {
    // 兼容A01和A1格式，统一转换为A1格式
    let id = wellId
    if (/^[A-H]0[1-9]$/.test(wellId)) {
      id = wellId.charAt(0) + wellId.slice(2)
    }
    const found = rawData.find(well => well.wellId === id)
    console.log('getWellData', wellId, id, found)
    return found?.timePoints || []
  }

  const getWellColor = (wellId: string) => {
    const result = results.find(r => r.wellId === wellId)
    if (result && !result.isValid) return '#ef4444' // red for invalid
    if (selectedWells.has(wellId)) return '#2258cf' // accent for selected
    return '#6b7280' // gray for unselected
  }

  const handleWellClick = (wellId: string) => {
    // TODO: Implement well selection toggle
    console.log('Clicked well:', wellId)
  }

  // 计算全局最大Y值和最小Y值
  let globalMaxY = 0
  let globalMinY = Number.POSITIVE_INFINITY
  let globalMaxX = 0
  for (const well of rawData) {
    for (let i = 0; i < well.timePoints.length; i++) {
      if (well.timePoints[i] > globalMaxY) globalMaxY = well.timePoints[i]
      if (well.timePoints[i] < globalMinY) globalMinY = well.timePoints[i]
    }
    if (well.timePoints.length - 1 > globalMaxX) globalMaxX = well.timePoints.length - 1
  }
  if (globalMaxY <= 0) globalMaxY = 1
  if (!isFinite(globalMinY) || globalMinY < 0) globalMinY = 0
  // 不加padding

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Time Series Plots</h3>
        <div className="text-sm text-gray-600">
          {selectedWells.size} wells selected
        </div>
      </div>

      <div className="grid grid-cols-13 gap-0 h-[480px]">
        {/* Column headers */}
        <div className="h-8"></div>
        {cols.map(col => (
          <div key={col} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {col}
          </div>
        ))}
        
        {/* Row headers and sparklines */}
        {rows.map(row => (
          <React.Fragment key={row}>
            <div className="h-10 flex items-center justify-center text-xs font-medium text-gray-500">
              {row}
            </div>
            {cols.map(col => {
              const wellId = `${row}${col}`
              const data = getWellData(wellId)
              const color = getWellColor(wellId)
              const isSelected = selectedWells.has(wellId)
              // debug日志
              if (data && data.length > 0) {
                console.log('PlotArea wellId:', wellId, 'data:', data)
              }
              return (
                <div key={wellId} className="h-9 flex items-center justify-center">
                  <ChartJsSparkline
                    data={data}
                    width={90}
                    height={75}
                    color={color}
                    isSelected={isSelected}
                    onClick={() => handleWellClick(wellId)}
                    xDomain={data.length > 0 ? data.length - 1 : 1}
                  />
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend removed */}
    </div>
  )
} 