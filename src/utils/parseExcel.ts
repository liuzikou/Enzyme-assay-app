import * as XLSX from 'xlsx'
import { WellData } from '../features/hooks'

/**
 * Parse an Excel file exported by the plate reader.
 * - Reads the "Table All Cycles" sheet
 * - Skips the first 10 rows and the second column
 * - Filters time columns based on selected time range
 * @param file Excel file uploaded by the user
 * @param timeRange Selected time range [start, end]
 */
export function parseExcel(file: File, timeRange: [number, number]): Promise<WellData[]> {
  const end = timeRange[1]
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets['Table All Cycles'] || wb.Sheets[wb.SheetNames[0]]
        if (!sheet) {
          reject(new Error('No usable sheet found in Excel file'))
          return
        }
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]
        const trimmed = rows.slice(10).map(r => r.filter((_, idx) => idx !== 1))
        if (trimmed.length < 2) {
          reject(new Error('Excel file format is not valid'))
          return
        }
        const header = trimmed[0].slice(0).map(v => String(v))
        const totalMinutes = header.length
        if (totalMinutes < end) {
          reject(new Error(`Excel file only contains ${totalMinutes} minutes of data`))
          return
        }
        const selectedCols = header.slice(0, end)
        const dataRows = trimmed.slice(1)
        const wells: WellData[] = []
        for (const row of dataRows) {
          const wellId = String(row[0]).trim()
          const values = row.slice(1, 1 + selectedCols.length).map(v => {
            const num = parseFloat(String(v))
            return isNaN(num) ? 0 : num
          })
          if (values.length === selectedCols.length && wellId) {
            wells.push({ wellId, timePoints: values })
          }
        }
        resolve(wells)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to read Excel file'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('File reading error'))
    reader.readAsArrayBuffer(file)
  })
}
