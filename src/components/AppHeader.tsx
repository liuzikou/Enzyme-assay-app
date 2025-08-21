import React from 'react'
import { useAssayStore, AssayType } from '../features/hooks'

export const AppHeader: React.FC = () => {
  const { assayType } = useAssayStore()

  const getAssayDescription = (type: AssayType) => {
    switch (type) {
      case 'T2943':
        return 'tPA Activity Assay'
      case 'HoFF':
        return 'Fibrinolysis: HoFF Test'
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
              <p className="text-lg font-medium text-accent">
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