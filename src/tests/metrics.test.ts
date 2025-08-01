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

describe('Basic Function Tests', () => {
  it('should have all functions defined', () => {
    expect(typeof diffArray).toBe('function')
    expect(typeof movingAvg).toBe('function')
    expect(typeof meanDuplicate).toBe('function')
    expect(typeof subtractArray).toBe('function')
    expect(typeof normaliseAlexa).toBe('function')
    expect(typeof calcT2943).toBe('function')
    expect(typeof calcS2251).toBe('function')
    expect(typeof calcHoFF).toBe('function')
    expect(typeof validateWellData).toBe('function')
  })

  it('should handle basic diffArray', () => {
    const result = diffArray([1, 2, 3, 4], 1)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle basic movingAvg', () => {
    const result = movingAvg([1, 2, 3, 4], 2)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle basic meanDuplicate', () => {
    const result = meanDuplicate([[1, 2], [3, 4]])
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle basic subtractArray', () => {
    const result = subtractArray([1, 2, 3], [0, 1, 2])
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle basic normaliseAlexa', () => {
    const result = normaliseAlexa([[1, 2, 3]], 1, 3)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle basic calcT2943', () => {
    const result = calcT2943([[1, 2, 3], [1, 2, 3]], 2)
    expect(typeof result.result).toBe('number')
  })

  it('should handle basic calcS2251', () => {
    const result = calcS2251([[1, 2, 3], [1, 2, 3]], [0, 0, 0], 2)
    expect(typeof result).toBe('number')
  })

  it('should handle basic calcHoFF', () => {
    const result = calcHoFF({
      duplicate: [[1, 2, 3], [1, 2, 3]],
      bgCtrl: [0, 0, 0],
      metric: 'MLR',
      window: 2,
      alexa0: 1,
      alexa100: 3
    })
    expect(typeof result).toBe('number')
  })

  it('should handle basic validateWellData', () => {
    const result = validateWellData([
      { wellId: 'A1', timePoints: [1, 2, 3] }
    ])
    expect(Array.isArray(result)).toBe(true)
  })
}) 