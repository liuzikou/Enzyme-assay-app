import React, { useState, useCallback, useEffect } from 'react'
import { useAssayStore, WellData } from '../features/hooks'
import { parseExcel } from '../utils/parseExcel'
import { DataPreviewTable } from './DataPreviewTable'

export const PasteTable: React.FC = () => {
  const { rawData, setRawData, setErrors, setSelectedWells, timeRange, errors } = useAssayStore()
  const [pasteText, setPasteText] = useState('')
  const [originalData, setOriginalData] = useState<string>('') // 存储原始粘贴数据

  // 支持多分隔符：逗号、空格、Tab、中文逗号
  const parseCSVData = useCallback((text: string): WellData[] => {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return []

    // 根据timeRange生成时间点（每分钟一个采样点）
    const endTime = timeRange[1]
    console.log('parseCSVData: timeRange =', timeRange, 'endTime =', endTime)
    console.log('parseCSVData: input text has', lines.length, 'lines')

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

      // 支持A01和A1两种格式，统一转换为A1~A12格式
      let wellId = wellIdRaw
      if (/^[A-H]0[1-9]$/.test(wellIdRaw)) {
        wellId = wellIdRaw.charAt(0) + wellIdRaw.slice(2)
      }
      // 强制A01/A1都变成A1，A10/A10都变成A10
      if (/^[A-H](0?[1-9]|1[0-2])$/.test(wellId)) {
        wellId = wellId.charAt(0) + String(Number(wellId.slice(1)))
      }
      // 再次强制标准化，防止遗漏
      wellId = wellId.charAt(0) + String(Number(wellId.slice(1)))
      
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

      console.log(`Well ${wellId}: raw data has ${values.length} points, first few values:`, values.slice(0, 5))

      // 检查数据点数量是否足够
      if (values.length < endTime) {
        console.log(`Well ${wellId}: expected ${endTime} points, got ${values.length} points, padding with zeros`)
        // 用0填充到所需长度，但保留原有数据
        const paddedValues = [...values]
        while (paddedValues.length < endTime) {
          paddedValues.push(0)
        }
        console.log(`Well ${wellId}: after padding, has ${paddedValues.length} points`)
        wells.push({
          wellId,
          timePoints: paddedValues
        })
      } else {
        // 数据足够，只取前endTime个数据点
        const truncatedValues = values.slice(0, endTime)
        console.log(`Well ${wellId}: data sufficient, truncated to ${truncatedValues.length} points`)
        wells.push({
          wellId,
          timePoints: truncatedValues
        })
      }
    }
    
    console.log('parseCSVData: processed', wells.length, 'wells, each with', wells[0]?.timePoints.length, 'time points')
    
    if (errors.length > 0) {
      throw new Error(errors.join('; '))
    }
    return wells
  }, [timeRange])

  // 当timeRange改变时，重新处理原始数据
  useEffect(() => {
    if (originalData && originalData.trim()) {
      console.log('Time range changed, reprocessing data with timeRange:', timeRange)
      try {
        // 直接在这里处理数据，而不是调用parseCSVData，避免依赖项问题
        const lines = originalData.trim().split('\n')
        const endTime = timeRange[1]
        console.log('Reprocessing with endTime:', endTime)
        
        const wells: WellData[] = []
        const errors: string[] = []
        
        for (let i = 0; i < lines.length && i < 96; i++) {
          const line = lines[i].split(/[\s,，\t]+/).map(s => s.trim())
          const wellIdRaw = line[0]
          
          if (!wellIdRaw) continue
          
          let wellId = wellIdRaw
          if (/^[A-H]0[1-9]$/.test(wellIdRaw)) {
            wellId = wellIdRaw.charAt(0) + wellIdRaw.slice(2)
          }
          if (/^[A-H](0?[1-9]|1[0-2])$/.test(wellId)) {
            wellId = wellId.charAt(0) + String(Number(wellId.slice(1)))
          }
          wellId = wellId.charAt(0) + String(Number(wellId.slice(1)))
          
          if (!/^[A-H](?:[1-9]|1[0-2])$/.test(wellId)) continue
          if (line.length < 2) continue
          
          const values = line.slice(1).map(val => {
            const num = parseFloat(val)
            return isNaN(num) ? 0 : num
          })

          console.log(`Reprocessing Well ${wellId}: raw data has ${values.length} points`)

          if (values.length < endTime) {
            console.log(`Well ${wellId}: padding from ${values.length} to ${endTime} points`)
            const paddedValues = [...values]
            while (paddedValues.length < endTime) {
              paddedValues.push(0)
            }
            wells.push({ wellId, timePoints: paddedValues })
          } else {
            console.log(`Well ${wellId}: truncating from ${values.length} to ${endTime} points`)
            const truncatedValues = values.slice(0, endTime)
            wells.push({ wellId, timePoints: truncatedValues })
          }
        }
        
        console.log('Reprocessed data:', wells.length, 'wells with', wells[0]?.timePoints.length, 'time points')
        setRawData(wells)
        setSelectedWells(new Set(wells.map(w => w.wellId)))
        setErrors([])
      } catch (error) {
        console.log('Error reprocessing data:', error)
        setRawData([])
        setSelectedWells(new Set())
        setErrors([error instanceof Error ? error.message : 'Invalid CSV format. Please check your data.'])
      }
    }
  }, [timeRange, originalData]) // 添加originalData作为依赖项

  const handlePaste = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setPasteText(text)
    setOriginalData(text) // 存储原始数据
    
    try {
      const wells = parseCSVData(text)
      console.log('wells to setRawData:', wells)
      setRawData(wells)
      setTimeout(() => {
        // @ts-ignore
        console.log('rawData after setRawData:', window.__ASSAY_STORE__ ? window.__ASSAY_STORE__.getState().rawData : wells)
      }, 100)
      setSelectedWells(new Set(wells.map(w => w.wellId))) // 自动选中有数据的孔
      setErrors([])
    } catch (error) {
      setRawData([])
      setSelectedWells(new Set())
      setErrors([error instanceof Error ? error.message : 'Invalid CSV format. Please check your data.'])
    }
  }, [parseCSVData, setRawData, setErrors, setSelectedWells])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      setRawData([])
      setSelectedWells(new Set())
      setErrors([`File size exceeds 1 MB limit`])
      e.target.value = ''
      return
    }
    try {
      const wells = await parseExcel(file, timeRange)
      const text = wells.map(w => [w.wellId, ...w.timePoints].join(',')).join('\n')
      setPasteText(text)
      setOriginalData(text) // 存储原始数据
      const parsed = parseCSVData(text)
      setRawData(parsed)
      setSelectedWells(new Set(parsed.map(w => w.wellId)))
      setErrors([])
    } catch (error) {
      setRawData([])
      setSelectedWells(new Set())
      setErrors([error instanceof Error ? error.message : 'Invalid Excel file. Please check your data.'])
    }
    e.target.value = ''
  }, [parseCSVData, setRawData, setErrors, setSelectedWells, timeRange])

  const handleClear = useCallback(() => {
    setPasteText('')
    setOriginalData('')
    setRawData([])
    setSelectedWells(new Set())
    setErrors([])
  }, [setRawData, setErrors, setSelectedWells])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste CSV Data (or import from Excel below)
        </label>
        <div className="overflow-auto border rounded bg-white" style={{maxHeight: '200px', maxWidth: '100%'}}>
          <textarea
            value={pasteText}
            onChange={handlePaste}
            placeholder={`Paste your CSV data here (same structure as Excel upload). First column should be Well ID (A1-H12 or A01-H12), followed by ${timeRange[1]} data points (0-${timeRange[1] - 1} minutes). Supports comma, space, tab, and Chinese comma as separators.`}
            className="input-field h-32 resize-none w-full min-w-[400px] border-0 focus:ring-0 font-mono"
            style={{display: 'block'}}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Upload Excel File
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="input-field"
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
        <DataPreviewTable data={rawData} />
      )}
    </div>
  )
} 