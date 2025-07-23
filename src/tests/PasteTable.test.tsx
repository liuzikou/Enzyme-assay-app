import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PasteTable } from '../components/PasteTable'
import { useAssayStore } from '../features/hooks'

// Mock the store
vi.mock('../features/hooks', () => ({
  useAssayStore: vi.fn()
}))

describe('PasteTable', () => {
  const mockSetRawData = vi.fn()
  const mockSetErrors = vi.fn()
  const mockSetSelectedWells = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    const mockStore = {
      rawData: [],
      timeRange: [0, 29], // 30个时间点
      errors: [],
      setRawData: mockSetRawData,
      setErrors: mockSetErrors,
      setSelectedWells: mockSetSelectedWells
    }
    ;(useAssayStore as any).mockReturnValue(mockStore)
  })

  it('accepts A1 format well IDs', () => {
    render(<PasteTable />)
    
    const textarea = screen.getByRole('textbox')
    const testData = `A1,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0,26.0,27.0,28.0,29.0,30.0`
    
    fireEvent.change(textarea, { target: { value: testData } })
    
    expect(mockSetRawData).toHaveBeenCalledWith([
      {
        wellId: 'A1',
        timePoints: Array.from({ length: 30 }, (_, i) => i + 1)
      }
    ])
    expect(mockSetErrors).toHaveBeenCalledWith([])
  })

  it('accepts A01 format well IDs and converts to A1', () => {
    render(<PasteTable />)
    
    const textarea = screen.getByRole('textbox')
    const testData = `A01,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0,26.0,27.0,28.0,29.0,30.0`
    
    fireEvent.change(textarea, { target: { value: testData } })
    
    expect(mockSetRawData).toHaveBeenCalledWith([
      {
        wellId: 'A1', // 应该转换为A1格式
        timePoints: Array.from({ length: 30 }, (_, i) => i + 1)
      }
    ])
    expect(mockSetErrors).toHaveBeenCalledWith([])
  })

  it('validates data point count matches time range', () => {
    render(<PasteTable />)
    
    const textarea = screen.getByRole('textbox')
    const testData = `A1,1.0,2.0,3.0` // 只有3个数据点，但需要30个
    
    fireEvent.change(textarea, { target: { value: testData } })
    
    expect(mockSetErrors).toHaveBeenCalledWith([
      expect.stringContaining('has 3 data points, expected 30')
    ])
  })

  it('rejects invalid well ID formats', () => {
    render(<PasteTable />)
    
    const textarea = screen.getByRole('textbox')
    const testData = `X1,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0,26.0,27.0,28.0,29.0,30.0`
    
    fireEvent.change(textarea, { target: { value: testData } })
    
    expect(mockSetErrors).toHaveBeenCalledWith([
      expect.stringContaining('Invalid Well ID')
    ])
  })

  it('updates placeholder text based on time range', () => {
    render(<PasteTable />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('30 data points (0-29 minutes)'))
  })
}) 