#!/usr/bin/env node

// Test background control data processing
console.log('Testing background control data processing...\n')

// Test data
const testData = {
  // Sample well data
  wellData: [0.100, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
  duplicateData: [0.100, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183],
  
  // Background control data (with duplicates)
  bgCtrlPrimary: [0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100],
  bgCtrlDuplicate: [0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100],
  
  smoothingWindow: 3
}

console.log('Test Data:')
console.log('Sample well data:', testData.wellData.map(v => v.toFixed(3)).join(', '))
console.log('Sample duplicate data:', testData.duplicateData.map(v => v.toFixed(3)).join(', '))
console.log('Background control primary:', testData.bgCtrlPrimary.map(v => v.toFixed(3)).join(', '))
console.log('Background control duplicate:', testData.bgCtrlDuplicate.map(v => v.toFixed(3)).join(', '))
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
console.log('=== Background Control Processing Test ===')

console.log('\nStep 1: Process sample data')
console.log('Sample dup-mean:')
const sampleMean = meanDuplicate([testData.wellData, testData.duplicateData])
console.log(sampleMean.map(v => v.toFixed(4)).join(', '))

console.log('\nSample LR:')
const sampleLr = diffArray(sampleMean, 1)
console.log(sampleLr.map(v => v.toFixed(6)).join(', '))

console.log('\nSample smoothed-LR:')
const sampleSmoothedLr = movingAvg(sampleLr, testData.smoothingWindow)
console.log(sampleSmoothedLr.map(v => v.toFixed(6)).join(', '))

console.log('\nStep 2: Process background control data (NEW METHOD)')
console.log('Background dup-mean:')
const bgMean = meanDuplicate([testData.bgCtrlPrimary, testData.bgCtrlDuplicate])
console.log(bgMean.map(v => v.toFixed(4)).join(', '))

console.log('\nBackground LR:')
const bgLr = diffArray(bgMean, 1)
console.log(bgLr.map(v => v.toFixed(6)).join(', '))

console.log('\nBackground smoothed-LR:')
const bgSmoothedLr = movingAvg(bgLr, testData.smoothingWindow)
console.log(bgSmoothedLr.map(v => v.toFixed(6)).join(', '))

console.log('\nStep 3: Calculate net-LR')
const netLr = subtractArray(sampleSmoothedLr, bgSmoothedLr)
console.log('net-LR:', netLr.map(v => v.toFixed(6)).join(', '))

console.log('\n=== Comparison with OLD METHOD ===')
console.log('Old method - Background LR (no dup-mean, no smoothing):')
const oldBgLr = diffArray(testData.bgCtrlPrimary, 1)
console.log(oldBgLr.map(v => v.toFixed(6)).join(', '))

console.log('\nOld method - net-LR:')
const oldNetLr = subtractArray(sampleSmoothedLr, oldBgLr)
console.log(oldNetLr.map(v => v.toFixed(6)).join(', '))

console.log('\n=== Summary ===')
console.log('New method - Background processing:')
console.log('  • dup-mean calculation: ✅')
console.log('  • LR calculation: ✅')
console.log('  • Smoothing: ✅')
console.log('  • Result: Background smoothed-LR')

console.log('\nOld method - Background processing:')
console.log('  • Direct LR calculation: ❌')
console.log('  • No smoothing: ❌')
console.log('  • Result: Raw background LR')

console.log('\nDifference in net-LR calculation:')
for (let i = 0; i < Math.min(netLr.length, oldNetLr.length); i++) {
  const diff = Math.abs(netLr[i] - oldNetLr[i])
  if (diff > 0.000001) {
    console.log(`Index ${i}: New=${netLr[i].toFixed(6)}, Old=${oldNetLr[i].toFixed(6)}, Diff=${diff.toFixed(6)}`)
  }
}

console.log('\nTest completed!')
