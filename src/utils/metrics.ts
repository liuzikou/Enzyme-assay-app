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
 * Calculate mean of duplicate measurements
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
 * Calculate T2943 - tPA Catalytic Rate
 */
export function calcT2943(duplicate: number[][], window: number): number {
  if (duplicate.length === 0 || window <= 0) return 0
  
  const mean = meanDuplicate(duplicate)
  if (mean.length === 0) return 0
  
  const dAbs = diffArray(mean, 1)
  if (dAbs.length === 0) return 0
  
  const smooth = movingAvg(dAbs, window)
  if (smooth.length === 0) return 0
  
  const maxVal = Math.max(...smooth)
  return isFinite(maxVal) ? maxVal : 0
}

/**
 * Calculate S2251 - Plasmin Generation Rate
 */
export function calcS2251(duplicate: number[][], bgCtrl: number[], window: number): number {
  if (duplicate.length === 0 || bgCtrl.length === 0 || window <= 0) return 0
  
  const mean = meanDuplicate(duplicate)
  if (mean.length === 0) return 0
  
  const dAbs = diffArray(mean, 1)
  if (dAbs.length === 0) return 0
  
  const smooth = movingAvg(dAbs, window)
  if (smooth.length === 0) return 0
  
  const net = subtractArray(smooth, bgCtrl)
  if (net.length === 0) return 0
  
  const mlr = Math.max(...net)
  if (!isFinite(mlr)) return 0
  
  const tmlr = net.indexOf(mlr)
  if (tmlr <= 0) return 0
  
  const lr0 = net[0] || 0
  const result = (mlr - lr0) / tmlr
  return isFinite(result) ? result : 0
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
  
  if (duplicate.length === 0 || bgCtrl.length === 0 || window <= 0) return 0
  
  const norm = normaliseAlexa(duplicate, alexa0, alexa100)
  if (norm.length === 0) return 0
  
  const hlt = norm.findIndex((v) => v >= 50)
  const dAbs = diffArray(norm, 1)
  if (dAbs.length === 0) return 0
  
  const smooth = movingAvg(dAbs, window)
  if (smooth.length === 0) return 0
  
  const net = subtractArray(smooth, bgCtrl)
  if (net.length === 0) return 0
  
  const mlr = Math.max(...net)
  if (!isFinite(mlr)) return 0
  
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