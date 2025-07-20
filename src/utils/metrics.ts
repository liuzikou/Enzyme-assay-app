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
 */
export function movingAvg(arr: number[], window: number): number[] {
  if (window <= 0 || arr.length === 0) return []
  if (window === 1) return [...arr]
  
  const result = []
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2))
    const end = Math.min(arr.length, i + Math.floor(window / 2) + 1)
    const slice = arr.slice(start, end)
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length
    result.push(avg)
  }
  return result
}

/**
 * Calculate mean of duplicate measurements
 */
export function meanDuplicate(duplicates: number[][]): number[] {
  if (duplicates.length === 0) return []
  
  const result = []
  const length = duplicates[0].length
  
  for (let i = 0; i < length; i++) {
    const values = duplicates.map(dup => dup[i]).filter(isFinite)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    result.push(mean)
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
    result.push(data[i] - bgCtrl[i])
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
  
  return mean.map(value => ((value - alexa0) / range) * 100)
}

/**
 * Calculate T2943 - tPA Catalytic Rate
 */
export function calcT2943(duplicate: number[][], window: number): number {
  const mean = meanDuplicate(duplicate)
  const dAbs = diffArray(mean, 1)
  const smooth = movingAvg(dAbs, window)
  return Math.max(...smooth)
}

/**
 * Calculate S2251 - Plasmin Generation Rate
 */
export function calcS2251(duplicate: number[][], bgCtrl: number[], window: number): number {
  const mean = meanDuplicate(duplicate)
  const dAbs = diffArray(mean, 1)
  const smooth = movingAvg(dAbs, window)
  const net = subtractArray(smooth, bgCtrl)
  const mlr = Math.max(...net)
  const tmlr = net.indexOf(mlr)
  const lr0 = net[0]
  
  if (tmlr === 0) return 0
  return (mlr - lr0) / tmlr
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
}): number {
  const { duplicate, bgCtrl, metric, window, alexa0, alexa100 } = options
  
  const norm = normaliseAlexa(duplicate, alexa0, alexa100)
  const hlt = norm.findIndex((v) => v >= 50)
  const net = subtractArray(movingAvg(diffArray(norm, 1), window), bgCtrl)
  const mlr = Math.max(...net)
  const tmlr = net.indexOf(mlr)
  const fi = tmlr > 0 ? mlr / tmlr : 0
  
  switch (metric) {
    case 'HLT':
      return hlt >= 0 ? hlt : -1
    case 'MLR':
      return mlr
    case 'TMLR':
      return tmlr >= 0 ? tmlr : -1
    case 'FI':
      return fi
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
  
  // Check for valid well IDs
  const validWellPattern = /^[A-H][1-9]|1[0-2]$/
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