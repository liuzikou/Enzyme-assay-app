import { create } from 'zustand'
import { z } from 'zod'
import { calcT2943, calcS2251, calcHoFF, validateWellData } from '../utils/metrics'

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
  showControlSelector: boolean
}

export interface AppActions {
  // Assay configuration
  setAssayType: (type: AssayType) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setTimeRange: (range: [number, number]) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setSmoothingWindow: (window: number) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setHoffMetric: (metric: HoFFMetric) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Data management
  setRawData: (data: WellData[]) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setSelectedWells: (wells: Set<string>) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setControl0Wells: (wells: Set<string>) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setControl100Wells: (wells: Set<string>) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Results
  setResults: (results: AssayResult[]) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setLoading: (loading: boolean) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setErrors: (errors: string[]) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // UI state
  setShowWellSelector: (show: boolean) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  setShowControlSelector: (show: boolean) => void // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Actions
  calculate: () => void
  reset: () => void
}

export type AppStore = AppState & AppActions

// Validation schemas
export const wellDataSchema = z.object({
  wellId: z.string().regex(/^[A-H][1-9]|1[0-2]$/),
  timePoints: z.array(z.number().finite()).min(1)
})

export const plateDataSchema = z.array(wellDataSchema).length(96)

// Store
export const useAssayStore = create<AppStore>((set, get) => ({
  // Initial state
  assayType: 'T2943',
  timeRange: [0, 30],
  smoothingWindow: 3,
  hoffMetric: 'MLR',
  
  rawData: [],
  selectedWells: new Set(),
  control0Wells: new Set(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12']),
  control100Wells: new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12']),
  
  results: [],
  isLoading: false,
  errors: [],
  
  showWellSelector: false,
  showControlSelector: false,
  
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
  setShowControlSelector: (show) => set({ showControlSelector: show }),
  
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
        
        try {
          let value = 0
          
          switch (state.assayType) {
            case 'T2943':
              // For T2943, we need duplicate measurements
              // For now, we'll use the single measurement as duplicate
              const duplicateT2943 = [wellData.timePoints, wellData.timePoints]
              value = calcT2943(duplicateT2943, state.smoothingWindow)
              break
              
            case 'S2251':
              // For S2251, we need background control
              if (state.control0Wells.size === 0) {
                throw new Error('No control wells selected for S2251')
              }
              
              // Calculate background control mean
              const controlData = state.rawData
                .filter(well => state.control0Wells.has(well.wellId))
                .map(well => well.timePoints)
              
              if (controlData.length === 0) {
                throw new Error('No control data available')
              }
              
              // Use first control as background
              const bgCtrlS2251 = controlData[0]
              const duplicateS2251 = [wellData.timePoints, wellData.timePoints]
              value = calcS2251(duplicateS2251, bgCtrlS2251, state.smoothingWindow)
              break
              
            case 'HoFF':
              // For HoFF, we need both control types
              if (state.control0Wells.size === 0 || state.control100Wells.size === 0) {
                throw new Error('Both 0% and 100% control wells required for HoFF')
              }
              
              // Calculate control means
              const control0Data = state.rawData
                .filter(well => state.control0Wells.has(well.wellId))
                .map(well => well.timePoints)
              
              const control100Data = state.rawData
                .filter(well => state.control100Wells.has(well.wellId))
                .map(well => well.timePoints)
              
              if (control0Data.length === 0 || control100Data.length === 0) {
                throw new Error('Control data not available')
              }
              
              const bgCtrlHoFF = control0Data[0]
              const alexa0 = control0Data[0][0] || 0
              const alexa100 = control100Data[0][0] || 100
              const duplicateHoFF = [wellData.timePoints, wellData.timePoints]
              
              value = calcHoFF({
                duplicate: duplicateHoFF,
                bgCtrl: bgCtrlHoFF,
                metric: state.hoffMetric,
                window: state.smoothingWindow,
                alexa0,
                alexa100
              })
              break
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