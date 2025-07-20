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
  })

  describe('movingAvg', () => {
    it('calculates moving average with window 3', () => {
      const input = [1, 2, 3, 4, 5, 6]
      const result = movingAvg(input, 3)
      expect(result.length).toBe(6)
      expect(result[0]).toBeCloseTo(1, 2)
      expect(result[1]).toBeCloseTo(1.5, 2)
    })

    it('returns original array for window 1', () => {
      const input = [1, 2, 3]
      expect(movingAvg(input, 1)).toEqual(input)
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
  })

  describe('subtractArray', () => {
    it('subtracts background control correctly', () => {
      const data = [10, 15, 20, 25]
      const bgCtrl = [5, 5, 5, 5]
      const expected = [5, 10, 15, 20]
      expect(subtractArray(data, bgCtrl)).toEqual(expected)
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
  })

  describe('calcT2943', () => {
    it('calculates T2943 metric correctly', () => {
      const duplicate = [
        [1, 2, 4, 7, 11],
        [1, 2, 4, 7, 11]
      ]
      const window = 2
      const result = calcT2943(duplicate, window)
      expect(typeof result).toBe('number')
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
      expect(typeof result).toBe('number')
      expect(isFinite(result)).toBe(true)
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
      expect(typeof result).toBe('number')
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
      expect(typeof result).toBe('number')
    })
  })

  describe('validateWellData', () => {
    it('validates correct data', () => {
      const data = [
        { wellId: 'A1', timePoints: [1, 2, 3] },
        { wellId: 'B2', timePoints: [4, 5, 6] }
      ]
      const errors = validateWellData(data)
      expect(Array.isArray(errors)).toBe(true)
    })

    it('handles empty data', () => {
      const errors = validateWellData([])
      expect(errors).toContain('No data provided')
    })
  })
}) 