import { describe, it, expect } from 'vitest'
import {
  diffArray,
  movingAvg,
  meanDuplicate,
  subtractArray,
  normaliseAlexa,
  calcT2943,
  calcS2251,
  calcHoFF,
  validateWellData
} from '../utils/metrics'

describe('Metrics Utilities', () => {
  describe('diffArray', () => {
    it('calculates first order differences correctly', () => {
      const input = [1, 3, 6, 10, 15]
      const expected = [2, 3, 4, 5]
      expect(diffArray(input, 1)).toEqual(expected)
    })

    it('returns empty array for insufficient data', () => {
      expect(diffArray([1], 1)).toEqual([])
      expect(diffArray([], 1)).toEqual([])
    })

    it('returns original array for order 0', () => {
      const input = [1, 2, 3]
      expect(diffArray(input, 0)).toEqual(input)
    })
  })

  describe('movingAvg', () => {
    it('calculates moving average with window 3', () => {
      const input = [1, 2, 3, 4, 5, 6]
      const result = movingAvg(input, 3)
      expect(result[0]).toBeCloseTo(1, 2)
      expect(result[1]).toBeCloseTo(1.5, 2)
      expect(result[2]).toBeCloseTo(2, 2)
      expect(result[3]).toBeCloseTo(3, 2)
      expect(result[4]).toBeCloseTo(4, 2)
      expect(result[5]).toBeCloseTo(5, 2)
    })

    it('returns original array for window 1', () => {
      const input = [1, 2, 3]
      expect(movingAvg(input, 1)).toEqual(input)
    })

    it('returns empty array for invalid window', () => {
      expect(movingAvg([1, 2, 3], 0)).toEqual([])
      expect(movingAvg([], 3)).toEqual([])
    })
  })

  describe('meanDuplicate', () => {
    it('calculates mean of duplicate measurements', () => {
      const duplicates = [
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5]
      ]
      const expected = [2, 3, 4]
      expect(meanDuplicate(duplicates)).toEqual(expected)
    })

    it('handles empty input', () => {
      expect(meanDuplicate([])).toEqual([])
    })

    it('filters out non-finite values', () => {
      const duplicates = [
        [1, 2, NaN],
        [2, 3, 4],
        [3, 4, 5]
      ]
      const result = meanDuplicate(duplicates)
      expect(result[0]).toBe(2)
      expect(result[1]).toBe(3)
      expect(isFinite(result[2])).toBe(true)
    })
  })

  describe('subtractArray', () => {
    it('subtracts background control correctly', () => {
      const data = [10, 15, 20, 25]
      const bgCtrl = [5, 5, 5, 5]
      const expected = [5, 10, 15, 20]
      expect(subtractArray(data, bgCtrl)).toEqual(expected)
    })

    it('handles different array lengths', () => {
      const data = [10, 15, 20]
      const bgCtrl = [5, 5]
      const expected = [5, 10]
      expect(subtractArray(data, bgCtrl)).toEqual(expected)
    })

    it('returns empty array for empty inputs', () => {
      expect(subtractArray([], [1, 2, 3])).toEqual([])
      expect(subtractArray([1, 2, 3], [])).toEqual([])
    })
  })

  describe('normaliseAlexa', () => {
    it('normalizes data correctly', () => {
      const data = [[100, 200, 300]]
      const alexa0 = 100
      const alexa100 = 300
      const expected = [0, 50, 100]
      expect(normaliseAlexa(data, alexa0, alexa100)).toEqual(expected)
    })

    it('handles zero range', () => {
      const data = [[100, 200, 300]]
      const alexa0 = 100
      const alexa100 = 100
      const result = normaliseAlexa(data, alexa0, alexa100)
      expect(result).toEqual([100, 200, 300])
    })
  })

  describe('calcT2943', () => {
    it('calculates T2943 metric correctly', () => {
      const duplicate = [
        [1, 2, 4, 7, 11],
        [1, 2, 4, 7, 11]
      ]
      const window = 2
      const result = calcT2943(duplicate, window)
      expect(result).toBeGreaterThan(0)
      expect(isFinite(result)).toBe(true)
    })
  })

  describe('calcS2251', () => {
    it('calculates S2251 metric correctly', () => {
      const duplicate = [
        [1, 2, 4, 7, 11],
        [1, 2, 4, 7, 11]
      ]
      const bgCtrl = [0.5, 0.5, 0.5, 0.5, 0.5]
      const window = 2
      const result = calcS2251(duplicate, bgCtrl, window)
      expect(result).toBeGreaterThan(0)
      expect(isFinite(result)).toBe(true)
    })

    it('returns 0 when tmlr is 0', () => {
      const duplicate = [[1, 1, 1, 1, 1]]
      const bgCtrl = [0, 0, 0, 0, 0]
      const window = 2
      expect(calcS2251(duplicate, bgCtrl, window)).toBe(0)
    })
  })

  describe('calcHoFF', () => {
    const duplicate = [
      [50, 60, 70, 80, 90],
      [50, 60, 70, 80, 90]
    ]
    const bgCtrl = [0, 0, 0, 0, 0]
    const window = 2
    const alexa0 = 50
    const alexa100 = 90

    it('calculates HLT metric', () => {
      const result = calcHoFF({
        duplicate,
        bgCtrl,
        metric: 'HLT',
        window,
        alexa0,
        alexa100
      })
      expect(result).toBeGreaterThanOrEqual(-1)
    })

    it('calculates MLR metric', () => {
      const result = calcHoFF({
        duplicate,
        bgCtrl,
        metric: 'MLR',
        window,
        alexa0,
        alexa100
      })
      expect(result).toBeGreaterThan(0)
    })

    it('calculates TMLR metric', () => {
      const result = calcHoFF({
        duplicate,
        bgCtrl,
        metric: 'TMLR',
        window,
        alexa0,
        alexa100
      })
      expect(result).toBeGreaterThanOrEqual(-1)
    })

    it('calculates FI metric', () => {
      const result = calcHoFF({
        duplicate,
        bgCtrl,
        metric: 'FI',
        window,
        alexa0,
        alexa100
      })
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })

  describe('validateWellData', () => {
    it('validates correct data', () => {
      const data = [
        { wellId: 'A1', timePoints: [1, 2, 3] },
        { wellId: 'B2', timePoints: [4, 5, 6] }
      ]
      const errors = validateWellData(data)
      expect(errors).toEqual([])
    })

    it('detects invalid well IDs', () => {
      const data = [
        { wellId: 'A1', timePoints: [1, 2, 3] },
        { wellId: 'X1', timePoints: [4, 5, 6] }
      ]
      const errors = validateWellData(data)
      expect(errors).toContain('Invalid well IDs: X1')
    })

    it('detects duplicate well IDs', () => {
      const data = [
        { wellId: 'A1', timePoints: [1, 2, 3] },
        { wellId: 'A1', timePoints: [4, 5, 6] }
      ]
      const errors = validateWellData(data)
      expect(errors).toContain('Duplicate well IDs: A1')
    })

    it('detects non-numeric data', () => {
      const data = [
        { wellId: 'A1', timePoints: [1, 2, NaN] },
        { wellId: 'B2', timePoints: [4, 5, 6] }
      ]
      const errors = validateWellData(data)
      expect(errors).toContain('Non-numeric data found in wells: A1')
    })

    it('handles empty data', () => {
      const errors = validateWellData([])
      expect(errors).toContain('No data provided')
    })
  })
}) 