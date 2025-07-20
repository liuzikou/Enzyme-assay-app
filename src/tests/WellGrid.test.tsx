import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WellGrid } from '../components/WellGrid'

describe('WellGrid', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders 96 wells in 8x12 grid', () => {
    render(
      <WellGrid
        selected={new Set()}
        onChange={mockOnChange}
      />
    )

    // Check for column headers (1-12)
    for (let i = 1; i <= 12; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument()
    }

    // Check for row headers (A-H)
    for (const row of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      expect(screen.getByText(row)).toBeInTheDocument()
    }

    // Check for well buttons (A1-H12)
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('H12')).toBeInTheDocument()
  })

  it('calls onChange when well is clicked', () => {
    render(
      <WellGrid
        selected={new Set()}
        onChange={mockOnChange}
      />
    )

    fireEvent.click(screen.getByText('A1'))
    expect(mockOnChange).toHaveBeenCalledWith('A1')
  })

  it('shows selected wells with correct styling', () => {
    render(
      <WellGrid
        selected={new Set(['A1', 'B2'])}
        onChange={mockOnChange}
      />
    )

    const a1Button = screen.getByText('A1')
    const b2Button = screen.getByText('B2')
    const c3Button = screen.getByText('C3')

    expect(a1Button).toHaveClass('bg-accent')
    expect(b2Button).toHaveClass('bg-accent')
    expect(c3Button).not.toHaveClass('bg-accent')
  })

  it('shows correct title for different modes', () => {
    const { rerender } = render(
      <WellGrid
        selected={new Set()}
        onChange={mockOnChange}
        mode="wells"
      />
    )
    expect(screen.getByText('Select Wells')).toBeInTheDocument()

    rerender(
      <WellGrid
        selected={new Set()}
        onChange={mockOnChange}
        mode="control0"
      />
    )
    expect(screen.getByText('0% Control Wells')).toBeInTheDocument()

    rerender(
      <WellGrid
        selected={new Set()}
        onChange={mockOnChange}
        mode="control100"
      />
    )
    expect(screen.getByText('100% Control Wells')).toBeInTheDocument()
  })

  it('shows correct selection count', () => {
    render(
      <WellGrid
        selected={new Set(['A1', 'A2', 'A3'])}
        onChange={mockOnChange}
        mode="wells"
      />
    )

    expect(screen.getByText('Selected: 3 wells')).toBeInTheDocument()
  })
}) 