import React from 'react'
import { ChartJsSparkline } from './ChartJsSparkline'
import { useAssayStore } from '../features/hooks'

export const PlotArea: React.FC = () => {
  const { rawData, selectedWells, results, setSelectedWells } = useAssayStore()

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
    const newSelected = new Set(selectedWells)
    if (newSelected.has(wellId)) {
      newSelected.delete(wellId)
    } else {
      newSelected.add(wellId)
    }
    setSelectedWells(newSelected)
  }

  // Check which rows and columns have data
  const hasDataInRow = (row: string) => {
    return cols.some(col => {
      const wellId = `${row}${col}`
      const data = getWellData(wellId)
      return data.length > 0
    })
  }

  const hasDataInCol = (col: number) => {
    return rows.some(row => {
      const wellId = `${row}${col}`
      const data = getWellData(wellId)
      return data.length > 0
    })
  }

  // Filter rows and columns that have data
  const rowsWithData = rows.filter(hasDataInRow)
  const colsWithData = cols.filter(hasDataInCol)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Time Series Plots</h3>
        <div className="text-sm text-gray-600">
          {selectedWells.size} wells selected
        </div>
      </div>

      {/* Scrollable container */}
      <div className="overflow-auto">
        {/* Grid with minimum width to ensure scrolling */}
        <div 
          className="grid gap-0 h-[480px]" 
          style={{ 
            gridTemplateColumns: `60px repeat(${colsWithData.length}, 90px)`,
            minWidth: `${60 + (colsWithData.length * 90)}px`
          }}
        >
          {/* Column headers */}
          <div className="h-8 sticky top-0 bg-white z-10"></div>
          {colsWithData.map(col => (
            <div key={col} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 sticky top-0 bg-white z-10">
              {col}
            </div>
          ))}
          
          {/* Row headers and sparklines */}
          {rowsWithData.map(row => (
            <React.Fragment key={row}>
              <div className="h-10 flex items-center justify-center text-xs font-medium text-gray-500 sticky left-0 bg-white z-10">
                {row}
              </div>
              {colsWithData.map(col => {
                const wellId = `${row}${col}`
                const data = getWellData(wellId)
                const color = getWellColor(wellId)
                const isSelected = selectedWells.has(wellId)
                
                // Hide cells with no data
                if (data.length === 0) {
                  return (
                    <div key={wellId} className="h-9 flex items-center justify-center" style={{ 
                      width: '90px', 
                      minWidth: '90px', 
                      maxWidth: '90px', 
                      height: '75px', 
                      minHeight: '75px', 
                      maxHeight: '75px',
                      backgroundColor: '#f9fafb',
                      border: '1px dashed #d1d5db'
                    }}>
                      <span className="text-xs text-gray-400">-</span>
                    </div>
                  )
                }
                
                return (
                  <div key={wellId} className="h-9 flex items-center justify-center" style={{ width: '90px', minWidth: '90px', maxWidth: '90px', height: '75px', minHeight: '75px', maxHeight: '75px' }}>
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
      </div>
    </div>
  )
} 