import React from 'react'
import { useAssayStore, AssayType, HoFFMetric } from '../features/hooks'
import { WellGrid } from './WellGrid'
import { PasteTable } from './PasteTable'

export const InputPanel: React.FC = () => {
  const {
    assayType,
    timeRange,
    smoothingWindow,
    hoffMetric,
    selectedWells,
    control0Wells,
    control100Wells,
    showWellSelector,
    showControlSelector,
    setAssayType,
    setTimeRange,
    setSmoothingWindow,
    setHoffMetric,
    setSelectedWells,
    setControl0Wells,
    setControl100Wells,
    setShowWellSelector,
    setShowControlSelector,
    calculate,
    isLoading,
    rawData
  } = useAssayStore()

  const handleWellToggle = (wellId: string) => {
    const newSelected = new Set(selectedWells)
    if (newSelected.has(wellId)) {
      newSelected.delete(wellId)
    } else {
      newSelected.add(wellId)
    }
    setSelectedWells(newSelected)
  }

  const handleControl0Toggle = (wellId: string) => {
    const newSelected = new Set(control0Wells)
    if (newSelected.has(wellId)) {
      newSelected.delete(wellId)
    } else {
      newSelected.add(wellId)
    }
    setControl0Wells(newSelected)
  }

  const handleControl100Toggle = (wellId: string) => {
    const newSelected = new Set(control100Wells)
    if (newSelected.has(wellId)) {
      newSelected.delete(wellId)
    } else {
      newSelected.add(wellId)
    }
    setControl100Wells(newSelected)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Assay Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Assay
        </label>
        <select
          value={assayType}
          onChange={(e) => setAssayType(e.target.value as AssayType)}
          className="input-field"
        >
          <option value="T2943">T2943 - tPA Catalytic Rate</option>
          <option value="S2251">S2251 - Plasmin Generation Rate</option>
          <option value="HoFF">HoFF Test</option>
        </select>
      </div>

      {/* Well Selection */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Wells
          </label>
          <button
            onClick={() => setShowWellSelector(!showWellSelector)}
            className="btn-secondary text-sm"
          >
            {showWellSelector ? 'Hide' : 'Show'} Well Selector
          </button>
        </div>
        
        {showWellSelector && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <WellGrid
              selected={selectedWells}
              onChange={handleWellToggle}
              mode="wells"
            />
          </div>
        )}
        
        {!showWellSelector && (
          <p className="text-sm text-gray-600">
            Selected: {selectedWells.size} wells
          </p>
        )}
      </div>

      {/* Control Wells (for S2251 and HoFF) */}
      {(assayType === 'S2251' || assayType === 'HoFF') && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Control Wells
            </label>
            <button
              onClick={() => setShowControlSelector(!showControlSelector)}
              className="btn-secondary text-sm"
            >
              {showControlSelector ? 'Hide' : 'Show'} Control Selector
            </button>
          </div>
          
          {showControlSelector && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <WellGrid
                  selected={control0Wells}
                  onChange={handleControl0Toggle}
                  mode="control0"
                />
              </div>
              
              {assayType === 'HoFF' && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <WellGrid
                    selected={control100Wells}
                    onChange={handleControl100Toggle}
                    mode="control100"
                  />
                </div>
              )}
            </div>
          )}
          
          {!showControlSelector && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>0% Control: {control0Wells.size} wells</p>
              {assayType === 'HoFF' && (
                <p>100% Control: {control100Wells.size} wells</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range (minutes)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={timeRange[0]}
              onChange={(e) => setTimeRange([parseInt(e.target.value) || 0, timeRange[1]])}
              className="input-field"
              min="0"
            />
            <span className="flex items-center text-gray-500">to</span>
            <input
              type="number"
              value={timeRange[1]}
              onChange={(e) => setTimeRange([timeRange[0], parseInt(e.target.value) || 30])}
              className="input-field"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Smoothing Window
          </label>
          <input
            type="number"
            value={smoothingWindow}
            onChange={(e) => setSmoothingWindow(parseInt(e.target.value) || 3)}
            className="input-field"
            min="1"
            max="10"
          />
        </div>
      </div>

      {/* HoFF Metric Selection */}
      {assayType === 'HoFF' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Metric
          </label>
          <select
            value={hoffMetric}
            onChange={(e) => setHoffMetric(e.target.value as HoFFMetric)}
            className="input-field"
          >
            <option value="HLT">HLT - Half-Life Time</option>
            <option value="MLR">MLR - Maximum Linear Rate</option>
            <option value="TMLR">TMLR - Time to Maximum Linear Rate</option>
            <option value="FI">FI - Fibrin Index</option>
          </select>
        </div>
      )}

      {/* Data Input */}
      <div>
        <PasteTable />
      </div>

      {/* Actions */}
      <div className="flex space-x-2 pt-4 border-t">
        <button
          onClick={calculate}
          disabled={isLoading || selectedWells.size === 0 || rawData.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>
    </div>
  )
} 