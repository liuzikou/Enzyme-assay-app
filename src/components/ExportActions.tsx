import React from 'react'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { useAssayStore } from '../features/hooks'

export const ExportActions: React.FC = () => {
  const { results, assayType, rawData } = useAssayStore()

  // Create plate view data (8x12 grid)
  const createPlateViewData = () => {
    const plateData: (string | number)[][] = []
    
    // Add header row with column numbers
    const headerRow = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    plateData.push(headerRow)
    
    // Create 8x12 grid
    for (let row = 0; row < 8; row++) {
      const rowLetter = String.fromCharCode(65 + row) // A, B, C, ..., H
      const plateRow: (string | number)[] = [rowLetter]
      
      for (let col = 1; col <= 12; col++) {
        const wellId = `${rowLetter}${col}`
        const result = results.find(r => r.wellId === wellId)
        
        if (result && result.isValid) {
          plateRow.push(result.value)
        } else {
          plateRow.push('')
        }
      }
      plateData.push(plateRow)
    }
    
    return plateData
  }

  const exportToCSV = () => {
    if (results.length === 0) return

    const plateData = createPlateViewData()
    const csvContent = plateData.map(row => 
      row.map(cell => typeof cell === 'string' ? cell : cell.toFixed(4)).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `enzyme_assay_results_${assayType}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportToXLSX = () => {
    if (results.length === 0) return

    const plateData = createPlateViewData()
    
    // Convert to worksheet format
    const worksheet = XLSX.utils.aoa_to_sheet(plateData)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `enzyme_assay_results_${assayType}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportPlots = () => {
    // This would require html2canvas or similar library to capture plots
    // For now, we'll show a message
    alert('Plot export functionality requires additional libraries. Please use browser screenshot for now.')
  }

  const exportRawData = () => {
    if (rawData.length === 0) return

    const headers = ['Well ID', ...Array.from({ length: rawData[0]?.timePoints.length || 0 }, (_, i) => `T${i}`)]
    const csvContent = [
      headers.join(','),
      ...rawData.map(well => [
        well.wellId,
        ...well.timePoints.map(point => point.toFixed(4))
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `raw_data_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={exportToCSV}
          disabled={results.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Results (CSV)
        </button>
        
        <button
          onClick={exportToXLSX}
          disabled={results.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Results (XLSX)
        </button>
        
        <button
          onClick={exportPlots}
          disabled={rawData.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Plots
        </button>
        
        <button
          onClick={exportRawData}
          disabled={rawData.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Raw Data
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>• CSV/XLSX exports include results in plate view format (8x12 grid)</p>
        <p>• Raw data export includes all time series data</p>
        <p>• Plot export requires browser screenshot (coming soon)</p>
      </div>
    </div>
  )
} 