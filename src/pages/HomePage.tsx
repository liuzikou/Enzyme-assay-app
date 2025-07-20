import React from 'react'
import { AppHeader } from '../components/AppHeader'
import { InputPanel } from '../components/InputPanel'
import { PlotArea } from '../components/PlotArea'
import { ResultsTable } from '../components/ResultsTable'
import { ExportActions } from '../components/ExportActions'
import { useAssayStore } from '../features/hooks'

export const HomePage: React.FC = () => {
  const { errors, results, isLoading, rawData } = useAssayStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <InputPanel />
          </div>
          
          {/* Results Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
            
            {/* Plot Area */}
            {rawData.length > 0 && <PlotArea />}
            
            {/* Results Table */}
            {results.length > 0 && <ResultsTable />}
            
            {/* Export Actions */}
            {(results.length > 0 || rawData.length > 0) && <ExportActions />}
            
            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                  <p className="text-gray-600 mt-2">Calculating results...</p>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {!isLoading && results.length === 0 && rawData.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>No data available. Paste CSV data and select wells to get started.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 