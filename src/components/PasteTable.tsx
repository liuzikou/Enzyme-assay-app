import React, { useState, useCallback } from 'react'
import { useAssayStore, WellData } from '../features/hooks'

export const PasteTable: React.FC = () => {
  const { rawData, setRawData, setErrors } = useAssayStore()
  const [pasteText, setPasteText] = useState('')

  const parseCSVData = useCallback((text: string): WellData[] => {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return []

    // Parse data rows
    const wells: WellData[] = []
    
    for (let i = 1; i < lines.length && i <= 96; i++) {
      const line = lines[i].split(',').map(s => s.trim())
      const wellId = line[0]
      
      if (!wellId || !/^[A-H][1-9]|1[0-2]$/.test(wellId)) {
        continue
      }

      const values = line.slice(1).map(val => {
        const num = parseFloat(val)
        return isNaN(num) ? 0 : num
      })

      wells.push({
        wellId,
        timePoints: values
      })
    }

    return wells
  }, [])

  const handlePaste = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setPasteText(text)
    
    try {
      const wells = parseCSVData(text)
      setRawData(wells)
      setErrors([])
    } catch (error) {
      setErrors(['Invalid CSV format. Please check your data.'])
    }
  }, [parseCSVData, setRawData, setErrors])

  const handleClear = useCallback(() => {
    setPasteText('')
    setRawData([])
    setErrors([])
  }, [setRawData, setErrors])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste CSV Data
        </label>
        <textarea
          value={pasteText}
          onChange={handlePaste}
          placeholder="Paste your CSV data here... First column should be Well ID (A1-H12), followed by time columns"
          className="input-field h-32 resize-none"
        />
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleClear}
          className="btn-secondary"
        >
          Clear
        </button>
        <div className="text-sm text-gray-600 flex items-center">
          {rawData.length > 0 && (
            <span>Loaded {rawData.length} wells</span>
          )}
        </div>
      </div>

      {rawData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview (first 5 wells)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Well</th>
                  {rawData[0]?.timePoints.slice(0, 5).map((_, i) => (
                    <th key={i} className="text-right py-2 px-2">T{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawData.slice(0, 5).map(well => (
                  <tr key={well.wellId} className="border-b border-gray-100">
                    <td className="py-1 font-medium">{well.wellId}</td>
                    {well.timePoints.slice(0, 5).map((value, i) => (
                      <td key={i} className="text-right py-1 px-2">
                        {value.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 