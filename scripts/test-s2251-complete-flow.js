#!/usr/bin/env node

// Complete S2251 calculation flow test
console.log('Testing Complete S2251 Calculation Flow...\n')

// Test data
const testData = {
  wellId: 'A1',
  wellData: [0.100, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
  duplicateData: [0.100, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183],
  bgCtrl: [0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100],
  smoothingWindow: 3
}

console.log('Test Data:')
console.log('- Well ID:', testData.wellId)
console.log('- Well Data:', testData.wellData.map(v => v.toFixed(3)).join(', '))
console.log('- Duplicate Data:', testData.duplicateData.map(v => v.toFixed(3)).join(', '))
console.log('- Background Control:', testData.bgCtrl.map(v => v.toFixed(3)).join(', '))
console.log('- Smoothing Window:', testData.smoothingWindow)
console.log('')

// Mock utility functions
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

function diffArray(arr, order = 1) {
  if (order === 0) return [...arr]
  if (arr.length <= order) return []
  
  const diff = []
  for (let i = order; i < arr.length; i++) {
    diff.push(arr[i] - arr[i - order])
  }
  return diff
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

// Complete S2251 calculation
console.log('=== S2251 Calculation Steps ===')

console.log('\nStep 1: Calculate mean of duplicate wells (dup-mean)')
const mean = meanDuplicate([testData.wellData, testData.duplicateData])
console.log('Mean data:', mean.map(v => v.toFixed(4)).join(', '))
console.log('Length:', mean.length)

console.log('\nStep 2: Calculate first-order difference to get Lysis Rate (LR)')
const lr = diffArray(mean, 1)
console.log('LR calculation:')
console.log('Mean data:', mean.map(v => v.toFixed(4)).join(', '))
console.log('LR result:', lr.map(v => v.toFixed(6)).join(', '))
console.log('Length:', lr.length)

// Show LR calculation details
console.log('\nLR Calculation Details:')
for (let i = 1; i < mean.length; i++) {
  const current = mean[i]
  const previous = mean[i - 1]
  const difference = current - previous
  console.log(`  LR[${i-1}] = ${current.toFixed(4)} - ${previous.toFixed(4)} = ${difference.toFixed(6)}`)
}

console.log('\nStep 3: Apply smoothing window to LR')
const smoothedLr = movingAvg(lr, testData.smoothingWindow)
console.log('Original LR:', lr.map(v => v.toFixed(6)).join(', '))
console.log('Smoothed LR:', smoothedLr.map(v => v.toFixed(6)).join(', '))
console.log('Length:', smoothedLr.length)

console.log('\nStep 4: Calculate background LR')
const bgLr = diffArray(testData.bgCtrl, 1)
console.log('Background control:', testData.bgCtrl.map(v => v.toFixed(3)).join(', '))
console.log('Background LR:', bgLr.map(v => v.toFixed(6)).join(', '))
console.log('Length:', bgLr.length)

console.log('\nStep 5: Calculate net-LR by subtracting background')
const netLr = subtractArray(smoothedLr, bgLr)
console.log('Smoothed LR:', smoothedLr.map(v => v.toFixed(6)).join(', '))
console.log('Background LR:', bgLr.map(v => v.toFixed(6)).join(', '))
console.log('Net-LR:', netLr.map(v => v.toFixed(6)).join(', '))
console.log('Length:', netLr.length)

console.log('\nStep 6: Find maximum net-LR and its position')
const maxNetLr = Math.max(...netLr)
const maxNetLrIndex = netLr.indexOf(maxNetLr)
console.log('Net-LR values:', netLr.map(v => v.toFixed(6)).join(', '))
console.log('Maximum value:', maxNetLr.toFixed(6))
console.log('Maximum position:', maxNetLrIndex)

console.log('\nStep 7: Calculate linear regression slope from start to maximum position')
const x = Array.from({length: maxNetLrIndex + 1}, (_, i) => i)
const y = netLr.slice(0, maxNetLrIndex + 1)
console.log('Regression X (time points):', x.join(', '))
console.log('Regression Y (net-LR values):', y.map(v => v.toFixed(6)).join(', '))

// Linear regression calculation
const n = x.length
const sumX = x.reduce((a, b) => a + b, 0)
const sumY = y.reduce((a, b) => a + b, 0)
const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

const regressionSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
console.log('Regression slope:', regressionSlope.toFixed(8))
console.log('PGR (scientific notation):', regressionSlope.toExponential(6))

console.log('\n=== Summary ===')
console.log('Step 1 - dup-mean length:', mean.length)
console.log('Step 2 - LR length:', lr.length)
console.log('Step 3 - smoothed-LR length:', smoothedLr.length)
console.log('Step 4 - net-LR length:', netLr.length)
console.log('Step 5 - max position:', maxNetLrIndex)
console.log('Step 6 - PGR:', regressionSlope.toExponential(6))

console.log('\nTest completed successfully!')
