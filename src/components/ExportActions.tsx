import React from 'react'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { useAssayStore } from '../features/hooks'

export const ExportActions: React.FC = () => {
  const { results, assayType, rawData } = useAssayStore()

  const exportToCSV = () => {
    if (results.length === 0) return

    const headers = ['Well ID', 'Value']
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.wellId,
        result.isValid ? result.value.toFixed(4) : 'Invalid'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `enzyme_assay_results_${assayType}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportToXLSX = () => {
    if (results.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(
      results.map(result => ({
        'Well ID': result.wellId,
        'Value': result.isValid ? result.value : 'Invalid'
      }))
    )

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
        <p>• CSV/XLSX exports include results table only (no summary statistics)</p>
        <p>• Raw data export includes all time series data</p>
        <p>• Plot export requires browser screenshot (coming soon)</p>
      </div>
    </div>
  )
} 