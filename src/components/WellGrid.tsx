import React from 'react'

interface WellGridProps {
  selected: Set<string>
  onChange: (wellId: string) => void
  mode?: 'wells' | 'control0' | 'control100'
  disabled?: boolean
}

export const WellGrid: React.FC<WellGridProps> = ({
  selected,
  onChange,
  mode = 'wells',
  disabled = false
}) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const cols = Array.from({ length: 12 }, (_, i) => i + 1)

  const getWellColor = (wellId: string) => {
    if (disabled) return 'bg-gray-100'
    
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
        return '0% Control Wells'
      case 'control100':
        return '100% Control Wells'
      default:
        return 'Select Wells'
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
                  onClick={() => !disabled && onChange(wellId)}
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
        {mode === 'wells' && (
          <p>Selected: {selected.size} wells</p>
        )}
        {mode === 'control0' && (
          <p>0% Control: {selected.size} wells</p>
        )}
        {mode === 'control100' && (
          <p>100% Control: {selected.size} wells</p>
        )}
      </div>
    </div>
  )
} 