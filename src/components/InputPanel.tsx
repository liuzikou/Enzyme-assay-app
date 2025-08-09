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
    setAssayType,
    setTimeRange,
    setSmoothingWindow,
    setHoffMetric,
    setSelectedWells,
    setControl0Wells,
    setControl100Wells,
    calculate,
    isLoading,
    rawData
  } = useAssayStore()
  
  const [isWellSelectorCollapsed, setIsWellSelectorCollapsed] = useState(false)
  const [wellSelectionMode, setWellSelectionMode] = useState<'sample' | 'control0' | 'control100'>('sample')

  const handleCombinedWellToggle = (wellId: string) => {
    // Handle well selection based on current mode
    if (wellSelectionMode === 'sample') {
      // Remove from control wells if present
      if (control0Wells.has(wellId)) {
        const newControl0 = new Set(control0Wells)
        newControl0.delete(wellId)
        setControl0Wells(newControl0)
      }
      if (control100Wells.has(wellId)) {
        const newControl100 = new Set(control100Wells)
        newControl100.delete(wellId)
        setControl100Wells(newControl100)
      }
      // Toggle sample wells
      const newSelected = new Set(selectedWells)
      if (newSelected.has(wellId)) {
        newSelected.delete(wellId)
      } else {
        newSelected.add(wellId)
      }
      setSelectedWells(newSelected)
    } else if (wellSelectionMode === 'control0') {
      // Remove from control100 if present
      if (control100Wells.has(wellId)) {
        const newControl100 = new Set(control100Wells)
        newControl100.delete(wellId)
        setControl100Wells(newControl100)
      }
      // Toggle control0 wells
      const newControl0 = new Set(control0Wells)
      const newSelected = new Set(selectedWells)
      if (newControl0.has(wellId)) {
        newControl0.delete(wellId)
        newSelected.delete(wellId) // Also remove from selectedWells
      } else {
        newControl0.add(wellId)
        newSelected.add(wellId) // Also add to selectedWells for calculation
      }
      setControl0Wells(newControl0)
      setSelectedWells(newSelected)
    } else if (wellSelectionMode === 'control100') {
      // Remove from control0 if present
      if (control0Wells.has(wellId)) {
        const newControl0 = new Set(control0Wells)
        newControl0.delete(wellId)
        setControl0Wells(newControl0)
      }
      // Toggle control100 wells
      const newControl100 = new Set(control100Wells)
      const newSelected = new Set(selectedWells)
      if (newControl100.has(wellId)) {
        newControl100.delete(wellId)
        newSelected.delete(wellId) // Also remove from selectedWells
      } else {
        newControl100.add(wellId)
        newSelected.add(wellId) // Also add to selectedWells for calculation
      }
      setControl100Wells(newControl100)
      setSelectedWells(newSelected)
    }
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
          <option value="HoFF">Fibrinolysis: HoFF test</option>
        </select>
      </div>



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



      {/* Data Input */}
      <div>
        <PasteTable />
      </div>

      {/* Well Selection - Combined with Control Wells */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Wells
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
          <div className="space-y-4">
            {/* Selection Mode Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setWellSelectionMode('sample')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  wellSelectionMode === 'sample'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sample Wells
              </button>
              {(assayType === 'S2251' || assayType === 'HoFF') && (
                <button
                  onClick={() => setWellSelectionMode('control0')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    wellSelectionMode === 'control0'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  0% Control
                </button>
              )}
              {assayType === 'HoFF' && (
                <button
                  onClick={() => setWellSelectionMode('control100')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    wellSelectionMode === 'control100'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  100% Control
                </button>
              )}
            </div>
            
            {/* Well Grid */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <WellGrid
                selected={selectedWells}
                onChange={handleCombinedWellToggle}
                control0Wells={control0Wells}
                control100Wells={control100Wells}
                mode="combined"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex space-x-2">
          <button
            onClick={calculate}
            disabled={isLoading || selectedWells.size === 0 || rawData.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
        
        {/* HoFF Output Metric Selection */}
        {assayType === 'HoFF' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Output Metric:
            </label>
            <select
              value={hoffMetric}
              onChange={(e) => setHoffMetric(e.target.value as HoFFMetric)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="HLT">Half Lysis Time (HLT)</option>
              <option value="MLR">Max Lysis Rate (MLR)</option>
              <option value="TMLR">Time of Max Lysis Rate (TMLR)</option>
              <option value="FI">Fibrinolysis Index (FI)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
} 