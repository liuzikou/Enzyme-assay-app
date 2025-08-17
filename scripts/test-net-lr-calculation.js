#!/usr/bin/env node

// Test net-LR calculation
console.log('Testing net-LR calculation...\n')

// Test data
const testData = {
  wellData: [0.100, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
  duplicateData: [0.100, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183],
  bgCtrl: [0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100],
  smoothingWindow: 3
}

console.log('Test Data:')
console.log('Sample well data:', testData.wellData.map(v => v.toFixed(3)).join(', '))
console.log('Duplicate data:', testData.duplicateData.map(v => v.toFixed(3)).join(', '))
console.log('Background control:', testData.bgCtrl.map(v => v.toFixed(3)).join(', '))
console.log('Smoothing window:', testData.smoothingWindow)
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

// Test calculation
console.log('=== net-LR Calculation Test ===')

console.log('\nStep 1: Calculate mean of duplicates (dup-mean)')
const mean = meanDuplicate([testData.wellData, testData.duplicateData])
console.log('dup-mean:', mean.map(v => v.toFixed(4)).join(', '))

console.log('\nStep 2: Calculate first-order difference (LR)')
const lr = diffArray(mean, 1)
console.log('Sample LR:', lr.map(v => v.toFixed(6)).join(', '))

console.log('\nStep 3: Apply smoothing to sample LR')
const smoothedLr = movingAvg(lr, testData.smoothingWindow)
console.log('Sample smoothed-LR:', smoothedLr.map(v => v.toFixed(6)).join(', '))

console.log('\nStep 4: Calculate background LR')
const bgLr = diffArray(testData.bgCtrl, 1)
console.log('Background LR (before smoothing):', bgLr.map(v => v.toFixed(6)).join(', '))

console.log('\nStep 5: Apply smoothing to background LR')
const smoothedBgLr = movingAvg(bgLr, testData.smoothingWindow)
console.log('Background smoothed-LR:', smoothedBgLr.map(v => v.toFixed(6)).join(', '))

console.log('\nStep 6: Calculate net-LR')
const netLr = subtractArray(smoothedLr, smoothedBgLr)
console.log('net-LR:', netLr.map(v => v.toFixed(6)).join(', '))

console.log('\n=== Calculation Details ===')
console.log('Sample smoothed-LR length:', smoothedLr.length)
console.log('Background smoothed-LR length:', smoothedBgLr.length)
console.log('net-LR length:', netLr.length)

console.log('\n=== Step-by-step net-LR calculation ===')
for (let i = 0; i < Math.min(smoothedLr.length, smoothedBgLr.length); i++) {
  const sampleVal = smoothedLr[i]
  const bgVal = smoothedBgLr[i]
  const netVal = sampleVal - bgVal
  console.log(`net-LR[${i}] = ${sampleVal.toFixed(6)} - ${bgVal.toFixed(6)} = ${netVal.toFixed(6)}`)
}

console.log('\n=== Expected vs Actual ===')
// Expected values based on the calculation
const expectedNetLr = [
  0.006833,  // 0.006833 - 0.000000
  0.007833,  // 0.007833 - 0.000000
  0.008500,  // 0.008500 - 0.000000
  0.009000,  // 0.009000 - 0.000000
  0.009667,  // 0.009667 - 0.000000
  0.010333,  // 0.010333 - 0.000000
  0.011000   // 0.011000 - 0.000000
]

console.log('Expected net-LR:', expectedNetLr.map(v => v.toFixed(6)).join(', '))
console.log('Actual net-LR:  ', netLr.map(v => v.toFixed(6)).join(', '))

// Check if they match
const isCorrect = netLr.length === expectedNetLr.length && 
  netLr.every((val, i) => Math.abs(val - expectedNetLr[i]) < 0.000001)

console.log('\nnet-LR calculation is correct:', isCorrect ? '✅ YES' : '❌ NO')

if (!isCorrect) {
  console.log('\nDifferences:')
  for (let i = 0; i < Math.min(netLr.length, expectedNetLr.length); i++) {
    const diff = Math.abs(netLr[i] - expectedNetLr[i])
    if (diff > 0.000001) {
      console.log(`Index ${i}: Expected ${expectedNetLr[i].toFixed(6)}, Got ${netLr[i].toFixed(6)}, Diff: ${diff.toFixed(6)}`)
    }
  }
}

console.log('\nTest completed!')
