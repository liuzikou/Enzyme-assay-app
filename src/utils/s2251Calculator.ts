/**
 * S2251 Calculator Module
 * Implements the 5-step algorithm for Plasmin Generation Rate calculation
 */

import { meanDuplicate, diffArray, subtractArray, movingAvg } from './metrics'

export interface S2251DebugInfo {
  wellId: string
  originalData: number[]
  duplicateData: number[] | null
  meanData: number[]
  lr: number[]
  smoothedLr: number[]
  bgLr: number[]
  netLr: number[]
  maxNetLr: number
  maxNetLrIndex: number
  regressionSlope: number
  regressionData: { x: number[], y: number[] }
  finalResult: number
}

/**
 * Calculate S2251 - Plasmin Generation Rate
 * Algorithm:
 * 1. Calculate mean of duplicate wells; if only one well, use its input as output
 * 2. Calculate first-order difference to get Lysis Rate (LR) per minute
 * 3. Apply smoothing window to LR (early termination to ensure consistent window size)
 * 4. Subtract negative control's LR from each test's LR to get net-LR
 * 5. Find maximum value of net-LR and its position
 * 6. Calculate slope of linear regression from start to maximum net-LR position
 */
export function calcS2251(duplicate: number[][], bgCtrl: number[] | number[][], smoothingWindow: number = 3): number {
  if (duplicate.length === 0) return 0
  
  // Step 1: Calculate mean of duplicate wells, or use single well data
  const mean = meanDuplicate(duplicate)
  if (mean.length === 0) return 0
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  const lr = diffArray(mean, 1)
  if (lr.length === 0) return 0
  
  // Step 3: Apply smoothing window to LR (early termination to ensure consistent window size)
  const smoothedLr = movingAvg(lr, smoothingWindow)
  if (smoothedLr.length === 0) return 0
  
  // Step 4: Calculate net-LR by subtracting negative control smoothed LR
  let bgLr: number[]
  if (Array.isArray(bgCtrl[0])) {
    // bgCtrl is number[][] - process it like sample data
    const bgMean = meanDuplicate(bgCtrl as number[][])
    const bgLrRaw = diffArray(bgMean, 1)
    bgLr = movingAvg(bgLrRaw, smoothingWindow)
  } else {
    // bgCtrl is number[] - legacy format, process directly
    const bgLrRaw = diffArray(bgCtrl as number[], 1)
    bgLr = movingAvg(bgLrRaw, smoothingWindow)
  }
  
  const netLr = subtractArray(smoothedLr, bgLr)
  if (netLr.length === 0) return 0
  
  // Step 5: Find max net-LR and its position
  const maxNetLr = Math.max(...netLr)
  const maxNetLrIndex = netLr.indexOf(maxNetLr)
  
  if (!isFinite(maxNetLr) || maxNetLrIndex <= 0) return 0
  
  // Step 6: Calculate linear regression slope from start to max position
  const x = Array.from({ length: maxNetLrIndex + 1 }, (_, i) => i) // Time points: 0, 1, 2, ...
  const y = netLr.slice(0, maxNetLrIndex + 1) // Net-LR values up to max position
  
  // Linear regression calculation
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  return isFinite(slope) ? slope : 0
}

/**
 * Calculate S2251 with detailed debug information
 */
export function calcS2251WithDebug(
  duplicate: number[][], 
  bgCtrl: number[] | number[][],
  smoothingWindow: number = 3
): {
  result: number
  debug: {
    mean: number[]
    lr: number[]
    smoothedLr: number[]
    bgLr: number[]
    netLr: number[]
    maxNetLr: number
    maxNetLrIndex: number
    regressionSlope: number
    regressionData: { x: number[], y: number[] }
  }
} {
  // Initialize debug object
  const debug = {
    mean: [] as number[],
    lr: [] as number[],
    smoothedLr: [] as number[],
    bgLr: [] as number[],
    netLr: [] as number[],
    maxNetLr: 0,
    maxNetLrIndex: -1,
    regressionSlope: 0,
    regressionData: { x: [] as number[], y: [] as number[] }
  }

  if (duplicate.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 1: Calculate mean of duplicates
  debug.mean = meanDuplicate(duplicate)
  if (debug.mean.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  debug.lr = diffArray(debug.mean, 1)
  if (debug.lr.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 3: Apply smoothing window to LR (early termination to ensure consistent window size)
  debug.smoothedLr = movingAvg(debug.lr, smoothingWindow)
  if (debug.smoothedLr.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 4: Calculate net-LR by subtracting negative control smoothed LR
  let bgLr: number[]
  if (Array.isArray(bgCtrl[0])) {
    // bgCtrl is number[][] - process it like sample data
    const bgMean = meanDuplicate(bgCtrl as number[][])
    const bgLrRaw = diffArray(bgMean, 1)
    debug.bgLr = movingAvg(bgLrRaw, smoothingWindow)
  } else {
    // bgCtrl is number[] - legacy format, process directly
    const bgLrRaw = diffArray(bgCtrl as number[], 1)
    debug.bgLr = movingAvg(bgLrRaw, smoothingWindow)
  }
  debug.netLr = subtractArray(debug.smoothedLr, debug.bgLr)
  if (debug.netLr.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 5: Find max net-LR and its position
  debug.maxNetLr = Math.max(...debug.netLr)
  debug.maxNetLrIndex = debug.netLr.indexOf(debug.maxNetLr)
  
  if (!isFinite(debug.maxNetLr) || debug.maxNetLrIndex <= 0) {
    return { result: 0, debug }
  }
  
  // Step 6: Calculate linear regression slope from start to max position
  const x = Array.from({ length: debug.maxNetLrIndex + 1 }, (_, i) => i)
  const y = debug.netLr.slice(0, debug.maxNetLrIndex + 1)
  
  debug.regressionData = { x, y }
  
  // Linear regression calculation
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  debug.regressionSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  return { 
    result: isFinite(debug.regressionSlope) ? debug.regressionSlope : 0, 
    debug 
  }
}

/**
 * Format S2251 result in scientific notation
 */
export function formatS2251Result(value: number, sigDigits: number = 4): string {
  if (!isFinite(value) || value === 0) return "0";
  
  // For very small or very large numbers, use scientific notation
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
    return value.toExponential(sigDigits - 1);
  }
  
  // For normal numbers, use fixed decimal places
  return value.toFixed(sigDigits);
}

/**
 * Calculate S2251 for a single well with all necessary data
 */
export function calculateS2251ForWell(
  wellId: string,
  wellData: number[],
  duplicateData: number[] | null,
  bgCtrl: number[] | number[][],
  smoothingWindow: number = 3
): { result: number; debug: S2251DebugInfo | null } {
  try {
    console.log('calculateS2251ForWell called with:', {
      wellId,
      wellDataLength: wellData.length,
      duplicateDataLength: duplicateData?.length || 0,
      bgCtrlLength: bgCtrl.length,
      smoothingWindow
    })

    // Prepare data for calculation
    let s2251Data: number[][]
    if (duplicateData) {
      // Use both original and duplicate data
      s2251Data = [wellData, duplicateData]
      console.log('Using duplicate data, arrays:', s2251Data.length)
    } else {
      // Use single well data (wrap in array for meanDuplicate function)
      s2251Data = [wellData]
      console.log('Using single well data, arrays:', s2251Data.length)
    }
    
    // Calculate with debug info
    const { result: finalResult, debug } = calcS2251WithDebug(s2251Data, bgCtrl, smoothingWindow)
    console.log('calcS2251WithDebug completed, result:', finalResult)
    console.log('Debug object keys:', Object.keys(debug))
    
    const debugInfo: S2251DebugInfo = {
      wellId,
      originalData: wellData,
      duplicateData,
      meanData: debug.mean,
      lr: debug.lr,
      smoothedLr: debug.smoothedLr,
      bgLr: debug.bgLr,
      netLr: debug.netLr,
      maxNetLr: debug.maxNetLr,
      maxNetLrIndex: debug.maxNetLrIndex,
      regressionSlope: debug.regressionSlope,
      regressionData: debug.regressionData,
      finalResult
    }
    
    console.log('DebugInfo created successfully')
    return { result: finalResult, debug: debugInfo }
  } catch (error) {
    console.error('Error calculating S2251 for well:', wellId, error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    
    // Return a debug info object even on error, with empty arrays
    const errorDebugInfo: S2251DebugInfo = {
      wellId,
      originalData: wellData,
      duplicateData,
      meanData: [],
      lr: [],
      smoothedLr: [],
      bgLr: [],
      netLr: [],
      maxNetLr: 0,
      maxNetLrIndex: -1,
      regressionSlope: 0,
      regressionData: { x: [], y: [] },
      finalResult: 0
    }
    
    return { result: 0, debug: errorDebugInfo }
  }
}
