import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PlotArea } from '../components/PlotArea'
import { useAssayStore } from '../features/hooks'

vi.mock('../features/hooks', () => ({
  useAssayStore: vi.fn()
}))

const mockSetSelectedWells = vi.fn()

const baseStore = {
  rawData: [{ wellId: 'A1', timePoints: [0, 1, 2] }],
  results: [],
  setSelectedWells: mockSetSelectedWells
}

describe('PlotArea well selection', () => {
  beforeEach(() => {
    mockSetSelectedWells.mockClear()
  })

  it('selects well on click', () => {
    (useAssayStore as any).mockReturnValue({
      ...baseStore,
      selectedWells: new Set()
    })
    const { container } = render(<PlotArea />)
    const plot = container.querySelector('.cursor-pointer') as HTMLElement
    fireEvent.click(plot)
    const newSet = mockSetSelectedWells.mock.calls[0][0] as Set<string>
    expect(newSet.has('A1')).toBe(true)
  })

  it('deselects well on second click', () => {
    (useAssayStore as any).mockReturnValue({
      ...baseStore,
      selectedWells: new Set(['A1'])
    })
    const { container } = render(<PlotArea />)
    const plot = container.querySelector('.cursor-pointer') as HTMLElement
    fireEvent.click(plot)
    const newSet = mockSetSelectedWells.mock.calls[0][0] as Set<string>
    expect(newSet.has('A1')).toBe(false)
  })
})
