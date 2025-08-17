import React from 'react'

interface WellGridProps {
  selected: Set<string>
  onChange: (wellId: string) => void
  control0Wells?: Set<string>
  control100Wells?: Set<string>
  onControl0Change?: (wellId: string) => void
  onControl100Change?: (wellId: string) => void
  mode?: 'wells' | 'control0' | 'control100' | 'combined'
  disabled?: boolean
  assayType?: 'T2943' | 'S2251' | 'HoFF'
}

export const WellGrid: React.FC<WellGridProps> = ({
  selected,
  onChange,
  control0Wells = new Set(),
  control100Wells = new Set(),
  mode = 'wells',
  disabled = false,
  assayType
}) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const cols = Array.from({ length: 12 }, (_, i) => i + 1)

  const getWellColor = (wellId: string) => {
    if (disabled) return 'bg-gray-100'
    
    // Combined mode: show all well types with different colors
    if (mode === 'combined') {
      if (control0Wells.has(wellId)) {
        return 'bg-blue-500 text-white border-2 border-blue-600'
      }
      if (control100Wells.has(wellId)) {
        return 'bg-green-500 text-white border-2 border-green-600'
      }
      if (selected.has(wellId)) {
        return 'bg-purple-500 text-white border-2 border-purple-600'
      }
      return 'bg-white border border-gray-300 hover:bg-gray-50'
    }
    
    // Original single-mode behavior
    if (mode === 'control0' && selected.has(wellId)) {
      return 'bg-blue-500 text-white'
    }
    
    if (mode === 'control100' && selected.has(wellId)) {
      return 'bg-green-500 text-white'
    }
    
    if (mode === 'wells' && selected.has(wellId)) {
      return 'bg-accent text-white'
    }
    
    return 'bg-white border border-gray-300 hover:bg-gray-50'
  }

  const getModeTitle = () => {
    switch (mode) {
      case 'control0':
        return assayType === 'S2251' ? 'Negative Control Wells' : '0% Control Wells'
      case 'control100':
        return '100% Control Wells'
      case 'combined':
        return 'Select Wells & Control Wells'
      default:
        return 'Select Wells'
    }
  }

  const handleWellClick = (wellId: string) => {
    if (disabled) return

    if (mode === 'combined') {
      // In combined mode, we need to handle different selection types
      // This will be handled by the parent component based on current selection mode
      onChange(wellId)
    } else {
      // Original single-mode behavior
      onChange(wellId)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">{getModeTitle()}</h3>
      
      <div className="grid grid-cols-13 gap-1">
        {/* Column headers */}
        <div className="h-8"></div>
        {cols.map(col => (
          <div key={col} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
            {col}
          </div>
        ))}
        
        {/* Row headers and wells */}
        {rows.map(row => (
          <React.Fragment key={row}>
            <div className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
              {row}
            </div>
            {cols.map(col => {
              const wellId = `${row}${col}`
              return (
                <button
                  key={wellId}
                  onClick={() => handleWellClick(wellId)}
                  disabled={disabled}
                  className={`
                    h-8 w-8 rounded text-xs font-medium transition-colors
                    ${getWellColor(wellId)}
                    ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  {wellId}
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      
      <div className="text-sm text-gray-600">
        {mode === 'combined' && (
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <span className="w-4 h-4 bg-purple-500 rounded border"></span>
              Sample Wells: {(() => {
                // Count wells that are in selected but not in control wells
                let count = 0
                for (const wellId of selected) {
                  if (!control0Wells.has(wellId) && !control100Wells.has(wellId)) {
                    count++
                  }
                }
                return count
              })()}
            </p>
            <p className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 rounded border"></span>
              {assayType === 'S2251' ? 'Negative Control' : '0% Control'}: {control0Wells.size}
            </p>
            {/* Only show 100% Control if there are any control100Wells */}
            {control100Wells.size > 0 && (
              <p className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-500 rounded border"></span>
                100% Control: {control100Wells.size}
              </p>
            )}
          </div>
        )}
        {mode === 'wells' && (
          <p>Selected: {selected.size} wells</p>
        )}
        {mode === 'control0' && (
          <p>{assayType === 'S2251' ? 'Negative Control' : '0% Control'}: {selected.size} wells</p>
        )}
        {mode === 'control100' && (
          <p>100% Control: {selected.size} wells</p>
        )}
      </div>
    </div>
  )
} 