// Utility functions for enzyme assay calculations

/**
 * Calculate the difference between consecutive elements in an array
 */
export function diffArray(arr: number[], order: number = 1): number[] {
  if (order === 0) return [...arr]
  if (arr.length <= order) return []
  
  const diff = []
  for (let i = order; i < arr.length; i++) {
    diff.push(arr[i] - arr[i - order])
  }
  return diff
}

/**
 * Calculate moving average with specified window size
 * Only returns values where the full window is available
 */
export function movingAvg(arr: number[], window: number): number[] {
  if (window <= 0 || arr.length === 0) return []
  if (window === 1) return [...arr]
  if (window > arr.length) return [] // Window larger than array
  
  const result = []
  // Only calculate for positions where the full window is available
  for (let i = 0; i <= arr.length - window; i++) {
    const slice = arr.slice(i, i + window)
    
    if (slice.length === 0) {
      result.push(0)
      continue
    }
    
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length
    result.push(isFinite(avg) ? avg : 0)
  }
  return result
}

/**
 * Calculate mean of duplicate measurements from adjacent wells
 * @param wellId The current well ID (e.g., "A1")
 * @param rawData All well data
 * @returns Array of mean values for each time point, or null if no duplicate found
 */
export function meanDuplicateFromAdjacentWells(wellId: string, rawData: { wellId: string; timePoints: number[] }[]): number[] | null {
  // Parse well ID to get row and column
  const match = wellId.match(/^([A-H])(\d+)$/)
  if (!match) return null
  
  const row = match[1]
  const col = parseInt(match[2])
  
  // Get the first column with data for this row
  const firstCol = getFirstColumnWithData(row, rawData)
  if (firstCol === null) return null
  
  // Calculate relative position from first column
  const relativePos = col - firstCol + 1
  
  // Only process primary wells (odd relative positions)
  if (relativePos % 2 === 0) return null
  
  // Find the adjacent well (next column)
  const adjacentCol = col + 1
  if (adjacentCol > 12) return null // No adjacent well exists
  
  const adjacentWellId = `${row}${adjacentCol}`
  
  // Find both wells in raw data
  const currentWell = rawData.find(well => well.wellId === wellId)
  const adjacentWell = rawData.find(well => well.wellId === adjacentWellId)
  
  if (!currentWell || !adjacentWell) return null
  
  // Calculate mean of both wells
  const result = []
  const length = Math.min(currentWell.timePoints.length, adjacentWell.timePoints.length)
  
  for (let i = 0; i < length; i++) {
    const val1 = currentWell.timePoints[i]
    const val2 = adjacentWell.timePoints[i]
    
    if (isFinite(val1) && isFinite(val2)) {
      const mean = (val1 + val2) / 2
      result.push(mean)
    } else if (isFinite(val1)) {
      result.push(val1)
    } else if (isFinite(val2)) {
      result.push(val2)
    } else {
      result.push(0)
    }
  }
  
  return result
}

/**
 * Get the first column that has data for a given row
 */
export function getFirstColumnWithData(row: string, rawData: { wellId: string; timePoints: number[] }[]): number | null {
  for (let col = 1; col <= 12; col++) {
    const wellId = `${row}${col}`
    const well = rawData.find(w => w.wellId === wellId)
    if (well) {
      return col
    }
  }
  return null
}

/**
 * Check if a well is a duplicate well based on data availability
 */
export function isDuplicateWell(wellId: string, rawData: { wellId: string; timePoints: number[] }[]): boolean {
  const match = wellId.match(/^([A-H])(\d+)$/)
  if (!match) return false
  
  const row = match[1]
  const col = parseInt(match[2])
  
  // Get the first column with data for this row
  const firstCol = getFirstColumnWithData(row, rawData)
  if (firstCol === null) return false
  
  // Calculate relative position from first column
  const relativePos = col - firstCol + 1
  return relativePos % 2 === 0 // Even relative positions are duplicate wells
}

/**
 * Get the primary well ID for a duplicate well
 */
export function getPrimaryWellId(wellId: string, rawData: { wellId: string; timePoints: number[] }[]): string | null {
  const match = wellId.match(/^([A-H])(\d+)$/)
  if (!match) return null
  
  const row = match[1]
  const col = parseInt(match[2])
  
  // Get the first column with data for this row
  const firstCol = getFirstColumnWithData(row, rawData)
  if (firstCol === null) return null
  
  // Calculate relative position from first column
  const relativePos = col - firstCol + 1
  
  if (relativePos % 2 === 0) {
    // This is a duplicate well, return the primary well
    const primaryCol = col - 1
    return `${row}${primaryCol}`
  } else {
    // This is a primary well
    return wellId
  }
}

/**
 * Get the adjacent well ID for duplicate measurements
 */
export function getAdjacentWellId(wellId: string, rawData: { wellId: string; timePoints: number[] }[]): string | null {
  const match = wellId.match(/^([A-H])(\d+)$/)
  if (!match) return null
  
  const row = match[1]
  const col = parseInt(match[2])
  
  // Get the first column with data for this row
  const firstCol = getFirstColumnWithData(row, rawData)
  if (firstCol === null) return null
  
  // Calculate relative position from first column
  const relativePos = col - firstCol + 1
  
  if (relativePos % 2 === 1) {
    // This is a primary well, get the next column
    const adjacentCol = col + 1
    if (adjacentCol > 12) return null
    return `${row}${adjacentCol}`
  } else {
    // This is a duplicate well, get the previous column
    const adjacentCol = col - 1
    if (adjacentCol < 1) return null
    return `${row}${adjacentCol}`
  }
}

/**
 * Calculate mean of duplicate measurements (legacy function for backward compatibility)
 */
export function meanDuplicate(duplicates: number[][]): number[] {
  if (duplicates.length === 0) return []
  
  const result = []
  const length = duplicates[0].length
  
  for (let i = 0; i < length; i++) {
    const values = duplicates.map(dup => dup[i]).filter(isFinite)
    
    if (values.length === 0) {
      result.push(0)
      continue
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    result.push(isFinite(mean) ? mean : 0)
  }
  
  return result
}

/**
 * Subtract background control from data
 */
export function subtractArray(data: number[], bgCtrl: number[]): number[] {
  if (data.length === 0 || bgCtrl.length === 0) return []
  
  const result = []
  const minLength = Math.min(data.length, bgCtrl.length)
  
  for (let i = 0; i < minLength; i++) {
    const diff = data[i] - bgCtrl[i]
    result.push(isFinite(diff) ? diff : 0)
  }
  
  return result
}

/**
 * Normalize data using Alexa 0% and 100% controls
 */
export function normaliseAlexa(data: number[][], alexa0: number, alexa100: number): number[] {
  if (data.length === 0) return []
  
  const mean = meanDuplicate(data)
  const range = alexa100 - alexa0
  
  if (range === 0) return mean
  
  return mean.map(value => {
    const normalized = ((value - alexa0) / range) * 100
    return isFinite(normalized) ? normalized : 0
  })
}

/**
 * Calculate averaged data for control wells (handling both duplicate and single wells)
 */
export function getAveragedControlData(
  controlWellIds: Set<string>, 
  rawData: { wellId: string; timePoints: number[] }[]
): number[][] {
  const averagedData: number[][] = []
  
  for (const wellId of controlWellIds) {
    const wellData = rawData.find(well => well.wellId === wellId)
    if (!wellData) continue
    
    // Try to get duplicate well data
    const duplicateData = meanDuplicateFromAdjacentWells(wellId, rawData)
    if (duplicateData) {
      // Use averaged duplicate data
      averagedData.push(duplicateData)
    } else {
      // Use single well data if no duplicate exists
      averagedData.push(wellData.timePoints)
    }
  }
  
  return averagedData
}

/**
 * Calculate global min and max values from averaged control wells
 */
export function getGlobalControlValues(
  control0WellIds: Set<string>,
  control100WellIds: Set<string>,
  rawData: { wellId: string; timePoints: number[] }[]
): { globalMin: number; globalMax: number; alexa0: number; alexa100: number } {
  if (control0WellIds.size === 0 || control100WellIds.size === 0) {
    return { globalMin: 0, globalMax: 100, alexa0: 0, alexa100: 100 }
  }
  
  // Step 1: Get averaged data for control wells
  const control0AveragedData = getAveragedControlData(control0WellIds, rawData)
  const control100AveragedData = getAveragedControlData(control100WellIds, rawData)
  
  if (control0AveragedData.length === 0 || control100AveragedData.length === 0) {
    return { globalMin: 0, globalMax: 100, alexa0: 0, alexa100: 100 }
  }
  
  // Step 2: Flatten all averaged control values and find global min/max
  const allControl0Values = control0AveragedData.flat().filter(isFinite)
  const allControl100Values = control100AveragedData.flat().filter(isFinite)
  
  const globalMin = allControl0Values.length > 0 ? Math.min(...allControl0Values) : 0
  const globalMax = allControl100Values.length > 0 ? Math.max(...allControl100Values) : 100
  
  // Use global min for alexa0 and global max for alexa100 (from averaged data)
  const alexa0 = globalMin
  const alexa100 = globalMax
  
  return { globalMin, globalMax, alexa0, alexa100 }
}

/**
 * Enhanced HoFF calculation with debug information
 */
export function calcHoFFWithDebug(options: {
  duplicate: number[][]
  bgCtrl: number[]
  metric: 'HLT' | 'MLR' | 'TMLR' | 'FI'
  window: number
  alexa0: number
  alexa100: number
}): {
  result: number
  debug: {
    duplicateMean: number[]
    normalizedValues: number[]
    hltIndex: number
    diffValues: number[]
    smoothedValues: number[]
    netValues: number[]
    mlr: number
    tmlr: number
  }
} {
  const { duplicate, bgCtrl, metric, window, alexa0, alexa100 } = options
  
  // Initialize debug object
  const debug = {
    duplicateMean: [] as number[],
    normalizedValues: [] as number[],
    hltIndex: -1,
    diffValues: [] as number[],
    smoothedValues: [] as number[],
    netValues: [] as number[],
    mlr: 0,
    tmlr: -1
  }
  
  if (duplicate.length === 0 || bgCtrl.length === 0 || window <= 0) {
    return { result: 0, debug }
  }
  
  // Calculate mean of duplicates
  debug.duplicateMean = meanDuplicate(duplicate)
  if (debug.duplicateMean.length === 0) {
    return { result: 0, debug }
  }
  
  // Normalize test well values
  debug.normalizedValues = normaliseAlexa([debug.duplicateMean], alexa0, alexa100)
  if (debug.normalizedValues.length === 0) {
    return { result: 0, debug }
  }
  
  // Normalize 0% control values for Net calculation
  const normalizedBgCtrl = normaliseAlexa([bgCtrl], alexa0, alexa100)
  if (normalizedBgCtrl.length === 0) {
    return { result: 0, debug }
  }
  
  // Find HLT
  const rawHltIndex = debug.normalizedValues.findIndex((v) => v >= 50)
  // If 50% is never reached, use the total experiment time
  // When not reached, return the array length which represents the total experiment duration
  if (rawHltIndex >= 0) {
    debug.hltIndex = rawHltIndex
  } else {
    debug.hltIndex = debug.normalizedValues.length
  }
  
  // Calculate net values: test well normalized - 0% control normalized
  debug.netValues = subtractArray(debug.normalizedValues, normalizedBgCtrl)
  if (debug.netValues.length === 0) {
    return { result: 0, debug }
  }
  
  // Calculate diff and smooth on net values
  debug.diffValues = diffArray(debug.netValues, 1)
  if (debug.diffValues.length === 0) {
    return { result: 0, debug }
  }
  
  debug.smoothedValues = movingAvg(debug.diffValues, window)
  if (debug.smoothedValues.length === 0) {
    return { result: 0, debug }
  }
  
  // Calculate MLR and TMLR from smoothed net values
  debug.mlr = Math.max(...debug.smoothedValues.filter(isFinite))
  if (!isFinite(debug.mlr)) debug.mlr = 0
  
  // Convert 0-based index to 1-based time point (0-59min → 1-60min)
  const rawTmlrIndex = debug.smoothedValues.indexOf(debug.mlr)
  debug.tmlr = rawTmlrIndex >= 0 ? rawTmlrIndex + 1 : -1
  const fi = debug.tmlr > 0 ? debug.mlr / debug.tmlr : 0
  
  let result = 0
  switch (metric) {
    case 'HLT':
      result = debug.hltIndex
      break
    case 'MLR':
      result = debug.mlr
      break
    case 'TMLR':
      result = debug.tmlr >= 0 ? debug.tmlr : -1
      break
    case 'FI':
      result = isFinite(fi) ? fi : 0
      break
    default:
      result = 0
  }
  
  return { result, debug }
}

/**
 * Calculate T2943 - tPA Catalytic Rate with debug information
 */
export function calcT2943(duplicate: number[][], window: number, debug: boolean = false, preCalculatedMean?: number[]): { result: number; debug?: { mean: number[]; diff: number[]; smooth: number[]; maxVal: number } } {
  if (duplicate.length === 0 || window <= 0) return { result: 0 }
  
  // Use pre-calculated mean if provided, otherwise calculate from duplicate data
  const mean = preCalculatedMean || meanDuplicate(duplicate)
  if (mean.length === 0) return { result: 0 }
  
  const dAbs = diffArray(mean, 1)
  if (dAbs.length === 0) return { result: 0 }
  
  const smooth = movingAvg(dAbs, window)
  if (smooth.length === 0) return { result: 0 }
  
  const maxVal = Math.max(...smooth)
  const result = isFinite(maxVal) ? maxVal : 0
  
  if (debug) {
    return {
      result,
      debug: {
        mean,
        diff: dAbs,
        smooth,
        maxVal
      }
    }
  }
  
  return { result }
}



/**
 * Calculate HoFF Test metrics
 */
export function calcHoFF(options: {
  duplicate: number[][]
  bgCtrl: number[]
  metric: 'HLT' | 'MLR' | 'TMLR' | 'FI'
  window: number
  alexa0: number
  alexa100: number
  totalDuration?: number
}): number {
  const { duplicate, bgCtrl, metric, window, alexa0, alexa100, totalDuration } = options
  
  if (duplicate.length === 0 || bgCtrl.length === 0 || window <= 0) return 0
  
  const norm = normaliseAlexa(duplicate, alexa0, alexa100)
  if (norm.length === 0) return 0
  
  // Normalize 0% control values for Net calculation
  const normalizedBgCtrl = normaliseAlexa([bgCtrl], alexa0, alexa100)
  if (normalizedBgCtrl.length === 0) return 0
  
  const hlt = norm.findIndex((v) => v >= 50)
  
  // Calculate net values: test well normalized - 0% control normalized
  const net = subtractArray(norm, normalizedBgCtrl)
  if (net.length === 0) return 0
  
  // Calculate diff and smooth on net values
  const dAbs = diffArray(net, 1)
  if (dAbs.length === 0) return 0
  
  const smooth = movingAvg(dAbs, window)
  if (smooth.length === 0) return 0
  
  const mlr = Math.max(...smooth)
  if (!isFinite(mlr)) return 0
  
  // Convert 0-based index to 1-based time point (0-59min → 1-60min)
  const rawTmlrIndex = smooth.indexOf(mlr)
  const tmlr = rawTmlrIndex >= 0 ? rawTmlrIndex + 1 : -1
  const fi = tmlr > 0 ? mlr / tmlr : 0
  
  switch (metric) {
    case 'HLT':
      // If 50% is never reached, return the total experiment time
      // Use totalDuration if provided, otherwise use data length
      const hltResult = hlt >= 0 ? hlt : (totalDuration || norm.length)
      console.log(`HLT calculation: hlt=${hlt}, norm.length=${norm.length}, totalDuration=${totalDuration}, result=${hltResult}`)
      return hltResult
    case 'MLR':
      return mlr
    case 'TMLR':
      return tmlr
    case 'FI':
      return isFinite(fi) ? fi : 0
    default:
      return 0
  }
}

/**
 * Validate well data
 */
export function validateWellData(data: { wellId: string; timePoints: number[] }[]): string[] {
  const errors: string[] = []
  
  if (data.length === 0) {
    errors.push('No data provided')
    return errors
  }
  
  // Check for valid well IDs (support both A1 and A01 formats)
  const validWellPattern = /^[A-H](?:[1-9]|1[0-2])$/
  const invalidWells = data.filter(well => !validWellPattern.test(well.wellId))
  if (invalidWells.length > 0) {
    errors.push(`Invalid well IDs: ${invalidWells.map(w => w.wellId).join(', ')}`)
  }
  
  // Check for duplicate well IDs
  const wellIds = data.map(well => well.wellId)
  const duplicates = wellIds.filter((id, index) => wellIds.indexOf(id) !== index)
  if (duplicates.length > 0) {
    errors.push(`Duplicate well IDs: ${[...new Set(duplicates)].join(', ')}`)
  }
  
  // Check for numeric data
  const nonNumericWells = data.filter(well => 
    well.timePoints.some(point => !isFinite(point))
  )
  if (nonNumericWells.length > 0) {
    errors.push(`Non-numeric data found in wells: ${nonNumericWells.map(w => w.wellId).join(', ')}`)
  }
  
  return errors
} 