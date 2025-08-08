import React, { useState } from 'react'
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
    showControlSelector,
    setAssayType,
    setTimeRange,
    setSmoothingWindow,
    setHoffMetric,
    setSelectedWells,
    setControl0Wells,
    setControl100Wells,
    setShowControlSelector,
    calculate,
    isLoading,
    rawData
  } = useAssayStore()
  
  const [isWellSelectorCollapsed, setIsWellSelectorCollapsed] = useState(false)

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
          <option value="T2943">tPA catalytic rate</option>
          <option value="S2251">Plasmin generation rate</option>
          <option value="HoFF">HoFF</option>
        </select>
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
          <div className="flex flex-col space-y-2">
            <input
              type="range"
              min={30}
              max={120}
              step={30}
              value={timeRange[1]}
              onChange={e => setTimeRange([0, parseInt(e.target.value)])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>30</span>
              <span>60</span>
              <span>90</span>
              <span>120</span>
            </div>
            <div className="text-sm text-gray-700 mt-1">
              Duration: 0~{timeRange[1] - 1} min, {timeRange[1]} Time Points
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Smoothing Window
          </label>
          <input
            type="number"
            value={smoothingWindow}
            onChange={(e) => setSmoothingWindow(parseInt(e.target.value) || 10)}
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
            <option value="HLT">HLT - Half lysis time</option>
            <option value="MLR">MLR - Max lysis rate</option>
            <option value="TMLR">TMLR - Time of Max Lysis Rate</option>
            <option value="FI">FI - Fibrinolysis index</option>
          </select>
        </div>
      )}

      {/* Data Input */}
      <div>
        <PasteTable />
      </div>

      {/* Well Selection - Moved after data input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Wells ({selectedWells.size} selected)
          </label>
          <button
            onClick={() => setIsWellSelectorCollapsed(!isWellSelectorCollapsed)}
            className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
            style={{ transform: isWellSelectorCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {!isWellSelectorCollapsed && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <WellGrid
              selected={selectedWells}
              onChange={handleWellToggle}
              mode="wells"
            />
          </div>
        )}
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