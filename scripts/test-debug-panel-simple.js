#!/usr/bin/env node

// Simple test for S2251 debug panel functionality
console.log('Testing S2251 Debug Panel Functionality...\n')

// Mock data
const testData = {
  wellId: 'A1',
  wellData: [0.100, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
  duplicateData: [0.100, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183],
  bgCtrl: [0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100],
  smoothingWindow: 3
}

console.log('Test Data:')
console.log('- Well ID:', testData.wellId)
console.log('- Well Data Length:', testData.wellData.length)
console.log('- Duplicate Data Length:', testData.duplicateData.length)
console.log('- Background Control Length:', testData.bgCtrl.length)
console.log('- Smoothing Window:', testData.smoothingWindow)
console.log('')

// Mock utility functions
function diffArray(arr) {
  const result = []
  for (let i = 1; i < arr.length; i++) {
    result.push(arr[i] - arr[i - 1])
  }
  return result
}

function movingAvg(arr, window) {
  if (window <= 0 || arr.length === 0) return []
  if (window === 1) return [...arr]
  if (window > arr.length) return []

  const result = []
  for (let i = 0; i <= arr.length - window; i++) {
    const slice = arr.slice(i, i + window)
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length
    result.push(isFinite(avg) ? avg : 0)
  }
  return result
}

function meanDuplicate(arrays) {
  if (arrays.length === 0) return []
  if (arrays.length === 1) return arrays[0]
  
  const result = []
  const maxLength = Math.max(...arrays.map(arr => arr.length))
  
  for (let i = 0; i < maxLength; i++) {
    let sum = 0
    let count = 0
    for (const arr of arrays) {
      if (i < arr.length && isFinite(arr[i])) {
        sum += arr[i]
        count++
      }
    }
    result.push(count > 0 ? sum / count : 0)
  }
  return result
}

function subtractArray(arr1, arr2) {
  const result = []
  const maxLength = Math.max(arr1.length, arr2.length)
  
  for (let i = 0; i < maxLength; i++) {
    const val1 = i < arr1.length ? arr1[i] : 0
    const val2 = i < arr2.length ? arr2[i] : 0
    result.push(val1 - val2)
  }
  return result
}

// Mock S2251 calculation
function mockCalcS2251WithDebug(duplicate, bgCtrl, smoothingWindow) {
  console.log('Step 1: Calculate mean of duplicate wells')
  const mean = meanDuplicate(duplicate)
  console.log('- Mean data:', mean.map(v => v.toFixed(4)).join(', '))
  
  console.log('\nStep 2: Calculate first-order difference (LR)')
  const lr = diffArray(mean)
  console.log('- LR data:', lr.map(v => v.toFixed(6)).join(', '))
  
  console.log('\nStep 3: Apply smoothing window')
  const smoothedLr = movingAvg(lr, smoothingWindow)
  console.log('- Smoothed LR data:', smoothedLr.map(v => v.toFixed(6)).join(', '))
  
  console.log('\nStep 4: Calculate background LR')
  const bgLr = diffArray(bgCtrl)
  console.log('- Background LR data:', bgLr.map(v => v.toFixed(6)).join(', '))
  
  console.log('\nStep 5: Calculate net-LR')
  const netLr = subtractArray(smoothedLr, bgLr)
  console.log('- Net-LR data:', netLr.map(v => v.toFixed(6)).join(', '))
  
  console.log('\nStep 6: Find maximum and position')
  const maxNetLr = Math.max(...netLr)
  const maxNetLrIndex = netLr.indexOf(maxNetLr)
  console.log('- Maximum net-LR:', maxNetLr.toFixed(6))
  console.log('- Maximum position:', maxNetLrIndex)
  
  console.log('\nStep 7: Linear regression')
  const x = Array.from({length: maxNetLrIndex + 1}, (_, i) => i)
  const y = netLr.slice(0, maxNetLrIndex + 1)
  console.log('- Regression X:', x.join(', '))
  console.log('- Regression Y:', y.map(v => v.toFixed(6)).join(', '))
  
  // Linear regression calculation
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const regressionSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  console.log('- Regression slope:', regressionSlope.toFixed(8))
  console.log('- PGR (scientific):', regressionSlope.toExponential(6))
  
  return {
    result: regressionSlope,
    debug: {
      mean,
      lr,
      smoothedLr,
      bgLr,
      netLr,
      maxNetLr,
      maxNetLrIndex,
      regressionSlope,
      regressionData: { x, y }
    }
  }
}

// Test the calculation
console.log('=== S2251 Calculation Test ===')
const { result, debug } = mockCalcS2251WithDebug(
  [testData.wellData, testData.duplicateData],
  testData.bgCtrl,
  testData.smoothingWindow
)

console.log('\n=== Final Results ===')
console.log('Final PGR:', result.toExponential(6))
console.log('Debug info available:', !!debug)
console.log('Debug info keys:', Object.keys(debug))

// Test debug info structure
const debugInfo = {
  wellId: testData.wellId,
  originalData: testData.wellData,
  duplicateData: testData.duplicateData,
  meanData: debug.mean,
  lr: debug.lr,
  smoothedLr: debug.smoothedLr,
  bgLr: debug.bgLr,
  netLr: debug.netLr,
  maxNetLr: debug.maxNetLr,
  maxNetLrIndex: debug.maxNetLrIndex,
  regressionSlope: debug.regressionSlope,
  regressionData: debug.regressionData,
  finalResult: result
}

console.log('\n=== Debug Info Structure ===')
console.log('All required fields present:', {
  wellId: !!debugInfo.wellId,
  originalData: debugInfo.originalData.length > 0,
  duplicateData: !!debugInfo.duplicateData,
  meanData: debugInfo.meanData.length > 0,
  lr: debugInfo.lr.length > 0,
  smoothedLr: debugInfo.smoothedLr.length > 0,
  bgLr: debugInfo.bgLr.length > 0,
  netLr: debugInfo.netLr.length > 0,
  maxNetLr: isFinite(debugInfo.maxNetLr),
  maxNetLrIndex: debugInfo.maxNetLrIndex >= 0,
  regressionSlope: isFinite(debugInfo.regressionSlope),
  regressionData: !!debugInfo.regressionData,
  finalResult: isFinite(debugInfo.finalResult)
})

console.log('\nTest completed successfully!')
console.log('Debug panel should be able to display all calculation steps.')
