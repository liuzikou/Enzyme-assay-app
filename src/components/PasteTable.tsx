import React, { useState, useCallback } from 'react'
import { useAssayStore, WellData } from '../features/hooks'

export const PasteTable: React.FC = () => {
  const { rawData, setRawData, setErrors, setSelectedWells, timeRange, errors } = useAssayStore()
  const [pasteText, setPasteText] = useState('')

  // 支持多分隔符：逗号、空格、Tab、中文逗号
  const parseCSVData = useCallback((text: string): WellData[] => {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return []

    // 根据timeRange生成时间点（每分钟一个采样点）
    const [startTime, endTime] = timeRange
    const timePointsCount = endTime - startTime + 1
    const expectedDataPoints = timePointsCount

    // Parse data rows
    const wells: WellData[] = []
    const errors: string[] = []
    
    for (let i = 0; i < lines.length && i < 96; i++) {
      // 支持多分隔符
      const line = lines[i].split(/[\s,，\t]+/).map(s => s.trim())
      const wellIdRaw = line[0]
      
      if (!wellIdRaw) {
        errors.push(`Empty well ID at line ${i + 1}`)
        continue
      }

      // 支持A01和A1两种格式，统一转换为A1格式
      let wellId = wellIdRaw
      if (/^[A-H]0[1-9]$/.test(wellIdRaw)) {
        // 如果是A01格式，转换为A1格式
        wellId = wellIdRaw.charAt(0) + wellIdRaw.slice(2)
      }
      
      if (!/^[A-H](?:[1-9]|1[0-2])$/.test(wellId)) {
        errors.push(`Invalid Well ID at line ${i + 1}: ${wellIdRaw}`)
        continue
      }
      
      if (line.length < 2) {
        errors.push(`No data for well ${wellId} at line ${i + 1}`)
        continue
      }
      
      const values = line.slice(1).map(val => {
        const num = parseFloat(val)
        return isNaN(num) ? 0 : num
      })

      // 检查数据点数量是否匹配预期
      if (values.length !== expectedDataPoints) {
        errors.push(`Well ${wellId} has ${values.length} data points, expected ${expectedDataPoints} (time range: ${startTime}-${endTime} minutes)`)
        continue
      }

      wells.push({
        wellId,
        timePoints: values
      })
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join('; '))
    }
    return wells
  }, [timeRange])

  const handlePaste = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setPasteText(text)
    try {
      const wells = parseCSVData(text)
      setRawData(wells)
      setSelectedWells(new Set(wells.map(w => w.wellId))) // 自动选中有数据的孔
      setErrors([])
    } catch (error) {
      setRawData([])
      setSelectedWells(new Set())
      setErrors([error instanceof Error ? error.message : 'Invalid CSV format. Please check your data.'])
    }
  }, [parseCSVData, setRawData, setErrors, setSelectedWells])

  const handleClear = useCallback(() => {
    setPasteText('')
    setRawData([])
    setSelectedWells(new Set())
    setErrors([])
  }, [setRawData, setErrors, setSelectedWells])

  // 生成时间点标签用于预览
  const generateTimeLabels = () => {
    const [startTime, endTime] = timeRange
    const labels = []
    for (let i = startTime; i <= endTime; i++) {
      labels.push(`${i}min`)
    }
    return labels
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste CSV Data
        </label>
        <textarea
          value={pasteText}
          onChange={handlePaste}
          placeholder={`Paste your CSV data here... First column should be Well ID (A1-H12 or A01-H12), followed by ${timeRange[1] - timeRange[0] + 1} data points (${timeRange[0]}-${timeRange[1]} minutes). Supports comma, space, tab, and Chinese comma as separators.`}
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

      {/* 错误提示 */}
      {Array.isArray(errors) && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {errors.map((err, idx) => (
            <div key={idx}>{err}</div>
          ))}
        </div>
      )}

      {rawData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview (first 5 wells)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Well</th>
                  {generateTimeLabels().slice(0, 5).map((label, i) => (
                    <th key={i} className="text-right py-2 px-2">{label}</th>
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