import React from 'react'
import { AppHeader } from '../components/AppHeader'
import { InputPanel } from '../components/InputPanel'
import { PlotArea } from '../components/PlotArea'
import PlateResultsGrid from '../components/PlateResultsGrid'
import { ExportActions } from '../components/ExportActions'


import { useAssayStore } from '../features/hooks'

export const HomePage: React.FC = () => {
  const { errors, isLoading } = useAssayStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 错误提示 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Validation Errors:
            </h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-8">
          {/* Input Area */}
          <InputPanel />
          
          {/* Time Series Plots */}
          <PlotArea />

          {/* Result Table */}
          <PlateResultsGrid />
          
          {/* S2251 Debug Panel - Removed as requested */}
          
          {/* Export Options */}
          <ExportActions />
        </div>
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              <p className="text-gray-600 mt-2">Calculating results...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 