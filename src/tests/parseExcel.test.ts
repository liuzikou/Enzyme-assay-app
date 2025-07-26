import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseExcel } from '../utils/parseExcel'

function createWorkbook(minutes: number) {
  const rows: any[][] = []
  for (let i = 0; i < 10; i++) rows.push([''])
  const header1 = ['Well', 'Content']
  for (let i = 0; i < minutes; i++) header1.push('Raw Data (405)')
  const header2 = ['Time', '']
  for (let i = 0; i < minutes; i++) header2.push(`${i} min`)
  rows.push(header1)
  rows.push(header2)
  rows.push(['A01', 'Sample', ...Array.from({ length: minutes }, (_, i) => i + 0.1)])
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Table All Cycles')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new File([buf], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

describe('parseExcel', () => {
  it('throws when Excel does not contain enough data', async () => {
    const file = createWorkbook(30)
    await expect(parseExcel(file, [0, 60])).rejects.toThrow()
  })

  it('parses and trims time points', async () => {
    const file = createWorkbook(30)
    const result = await parseExcel(file, [0, 30])
    expect(result[0].timePoints.length).toBe(30)
  })
})
