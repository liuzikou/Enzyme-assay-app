import { create } from 'zustand'
import { z } from 'zod'
import { calcT2943, calcS2251, calcHoFF, validateWellData, meanDuplicateFromAdjacentWells, isDuplicateWell, getGlobalControlValues, getAveragedControlData } from '../utils/metrics'

// Types
export type AssayType = 'T2943' | 'S2251' | 'HoFF'
export type HoFFMetric = 'HLT' | 'MLR' | 'TMLR' | 'FI'

export interface WellData {
  wellId: string
  timePoints: number[]
}

export interface AssayResult {
  wellId: string
  value: number
  isValid: boolean
}

export interface AppState {
  // Assay configuration
  assayType: AssayType
  timeRange: [number, number]
  smoothingWindow: number
  hoffMetric: HoFFMetric
  
  // Data
  rawData: WellData[]
  selectedWells: Set<string>
  control0Wells: Set<string>
  control100Wells: Set<string>
  
  // Results
  results: AssayResult[]
  isLoading: boolean
  errors: string[]
  
  // UI state
  showWellSelector: boolean
  // Precision control
  sigDigits: number
}

export interface AppActions {
  // Assay configuration
  setAssayType: (type: AssayType) => void
  setTimeRange: (range: [number, number]) => void
  setSmoothingWindow: (window: number) => void
  setHoffMetric: (metric: HoFFMetric) => void
  
  // Data management
  setRawData: (data: WellData[]) => void
  setSelectedWells: (wells: Set<string>) => void
  setControl0Wells: (wells: Set<string>) => void
  setControl100Wells: (wells: Set<string>) => void
  
  // Results
  setResults: (results: AssayResult[]) => void
  setLoading: (loading: boolean) => void
  setErrors: (errors: string[]) => void
  
  // UI state
  setShowWellSelector: (show: boolean) => void
  
  // Actions
  calculate: () => void
  reset: () => void
  // Precision control
  incDigits: () => void
  decDigits: () => void
}

export type AppStore = AppState & AppActions

// Validation schemas
export const wellDataSchema = z.object({
  wellId: z.string().regex(/^[A-H](?:[1-9]|1[0-2])$/),
  timePoints: z.array(z.number().finite()).min(1)
})

export const plateDataSchema = z.array(wellDataSchema).length(96)

// Store
export const useAssayStore = create<AppStore>((set, get) => ({
  // Initial state
  assayType: 'T2943',
  timeRange: [0, 30],
  smoothingWindow: 10,
  hoffMetric: 'HLT',
  
  rawData: [],
  selectedWells: new Set(),
  control0Wells: new Set(['G11', 'G12']),
  control100Wells: new Set(['H11', 'H12']),
  
  results: [],
  isLoading: false,
  errors: [],
  
  showWellSelector: false,
  
  // Precision control
      sigDigits: 5,
    incDigits: () => set(s => ({ sigDigits: Math.min(6, s.sigDigits + 1) })),
    decDigits: () => set(s => ({ sigDigits: Math.max(1, s.sigDigits - 1) })),
  
  // Actions
  setAssayType: (type) => set({ assayType: type }),
  setTimeRange: (range) => set({ timeRange: range }),
  setSmoothingWindow: (window) => set({ smoothingWindow: window }),
  setHoffMetric: (metric) => set({ hoffMetric: metric }),
  
  setRawData: (data) => set({ rawData: data }),
  setSelectedWells: (wells) => set({ selectedWells: wells }),
  setControl0Wells: (wells) => set({ control0Wells: wells }),
  setControl100Wells: (wells) => set({ control100Wells: wells }),
  
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ isLoading: loading }),
  setErrors: (errors) => set({ errors }),
  
  setShowWellSelector: (show) => set({ showWellSelector: show }),
  
  calculate: () => {
    const state = get()
    set({ isLoading: true, errors: [] })
    
    try {
      // Validate data
      const validationErrors = validateWellData(state.rawData)
      if (validationErrors.length > 0) {
        set({ errors: validationErrors, isLoading: false })
        return
      }
      
      // Check if we have selected wells
      if (state.selectedWells.size === 0) {
        set({ errors: ['No wells selected for analysis'], isLoading: false })
        return
      }
      
      const results: AssayResult[] = []
      
      // Process each selected well
      for (const wellId of state.selectedWells) {
        const wellData = state.rawData.find(well => well.wellId === wellId)
        if (!wellData) continue
        
        // Skip duplicate wells - they will be handled by their primary wells
        if (isDuplicateWell(wellId, state.rawData)) {
          results.push({
            wellId,
            value: 0,
            isValid: false
          })
          continue
        }
        
        try {
          let value = 0
          
          // Get duplicate data from adjacent well
          const duplicateData = meanDuplicateFromAdjacentWells(wellId, state.rawData)
          
          switch (state.assayType) {
            case 'T2943': {
              // For T2943, use original duplicate array format
              const t2943Data = duplicateData ? [wellData.timePoints, duplicateData] : [wellData.timePoints, wellData.timePoints]
              const calcResult = calcT2943(t2943Data, state.smoothingWindow)
              value = calcResult.result
              break
            }
            case 'S2251': {
              if (state.control0Wells.size === 0) {
                throw new Error('No control wells selected for S2251')
              }
              const controlData = state.rawData
                .filter(well => state.control0Wells.has(well.wellId))
                .map(well => well.timePoints)
              if (controlData.length === 0) {
                throw new Error('No control data available')
              }
              const bgCtrlS2251 = controlData[0]
              // For S2251, use original duplicate array format
              const s2251Data = duplicateData ? [wellData.timePoints, duplicateData] : [wellData.timePoints, wellData.timePoints]
              value = calcS2251(s2251Data, bgCtrlS2251, state.smoothingWindow)
              break
            }
            case 'HoFF': {
              if (state.control0Wells.size === 0 || state.control100Wells.size === 0) {
                throw new Error('Both 0% and 100% control wells required for HoFF')
              }
              // Use new processing order: get averaged control values first
              const { alexa0, alexa100 } = getGlobalControlValues(
                state.control0Wells, 
                state.control100Wells, 
                state.rawData
              )
              // Get averaged control data for background control
              const control0AveragedData = getAveragedControlData(state.control0Wells, state.rawData)
              if (control0AveragedData.length === 0) {
                throw new Error('No valid 0% control data after averaging')
              }
              const bgCtrlHoFF = control0AveragedData[0]
              
              // For HoFF, use processed data based on new logic
              let processedData: number[][]
              if (duplicateData) {
                // Use the already averaged duplicate data
                processedData = [duplicateData]
              } else {
                // No duplicate well, use single well data
                processedData = [wellData.timePoints]
              }
              
              value = calcHoFF({
                duplicate: processedData,
                bgCtrl: bgCtrlHoFF,
                metric: state.hoffMetric,
                window: state.smoothingWindow,
                alexa0,
                alexa100
              })
              break
            }
          }
          
          results.push({
            wellId,
            value,
            isValid: isFinite(value)
          })
          
        } catch (error) {
          results.push({
            wellId,
            value: 0,
            isValid: false
          })
        }
      }
      
      set({ results, isLoading: false })
      
    } catch (error) {
      set({ 
        errors: [error instanceof Error ? error.message : 'Unknown error'], 
        isLoading: false 
      })
    }
  },
  
  reset: () => set({
    rawData: [],
    selectedWells: new Set(),
    results: [],
    errors: [],
    isLoading: false
  })
})) 