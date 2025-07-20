import React from 'react'
import { useAssayStore, AssayType } from '../features/hooks'

export const AppHeader: React.FC = () => {
  const { assayType, setAssayType } = useAssayStore()

  const getAssayDescription = (type: AssayType) => {
    switch (type) {
      case 'T2943':
        return 'tPA Catalytic Rate Analysis'
      case 'S2251':
        return 'Plasmin Generation Rate Analysis'
      case 'HoFF':
        return 'HoFF Test Analysis'
      default:
        return 'Enzyme Assay Analysis'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Enzyme Assay Analyzer
            </h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <select
                value={assayType}
                onChange={(e) => setAssayType(e.target.value as AssayType)}
                className="text-lg font-medium text-accent border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
              >
                <option value="T2943">T2943</option>
                <option value="S2251">S2251</option>
                <option value="HoFF">HoFF</option>
              </select>
              <p className="text-sm text-gray-600">
                {getAssayDescription(assayType)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Version 1.0
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 