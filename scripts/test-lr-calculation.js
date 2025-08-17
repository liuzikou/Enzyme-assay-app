#!/usr/bin/env node

// Test LR (first-order difference) calculation
console.log('Testing LR (first-order difference) calculation...\n')

// Test data
const testData = {
  wellData: [0.100, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
  duplicateData: [0.100, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183]
}

console.log('Test Data:')
console.log('Well Data:', testData.wellData.map(v => v.toFixed(3)).join(', '))
console.log('Duplicate Data:', testData.duplicateData.map(v => v.toFixed(3)).join(', '))
console.log('')

// Mock functions
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

// Test calculation
console.log('=== Step 1: Calculate mean of duplicates ===')
const mean = meanDuplicate([testData.wellData, testData.duplicateData])
console.log('Mean data:', mean.map(v => v.toFixed(4)).join(', '))
console.log('')

console.log('=== Step 2: Calculate first-order difference (LR) ===')
const lr = diffArray(mean, 1)
console.log('LR calculation:')
console.log('Mean data:', mean.map(v => v.toFixed(4)).join(', '))
console.log('LR result:', lr.map(v => v.toFixed(6)).join(', '))
console.log('')

// Show the calculation step by step
console.log('=== LR Calculation Details ===')
for (let i = 1; i < mean.length; i++) {
  const current = mean[i]
  const previous = mean[i - 1]
  const difference = current - previous
  console.log(`LR[${i-1}] = ${current.toFixed(4)} - ${previous.toFixed(4)} = ${difference.toFixed(6)}`)
}
console.log('')

// Expected values
console.log('=== Expected vs Actual ===')
const expectedLR = [
  0.0055,  // 0.1055 - 0.1000
  0.0070,  // 0.1125 - 0.1055
  0.0080,  // 0.1205 - 0.1125
  0.0085,  // 0.1290 - 0.1205
  0.0090,  // 0.1380 - 0.1290
  0.0095,  // 0.1475 - 0.1380
  0.0105,  // 0.1580 - 0.1475
  0.0110,  // 0.1690 - 0.1580
  0.0115   // 0.1805 - 0.1690
]

console.log('Expected LR:', expectedLR.map(v => v.toFixed(6)).join(', '))
console.log('Actual LR:  ', lr.map(v => v.toFixed(6)).join(', '))
console.log('')

// Check if they match
const isCorrect = lr.length === expectedLR.length && 
  lr.every((val, i) => Math.abs(val - expectedLR[i]) < 0.000001)

console.log('LR calculation is correct:', isCorrect ? '✅ YES' : '❌ NO')

if (!isCorrect) {
  console.log('\nDifferences:')
  for (let i = 0; i < Math.min(lr.length, expectedLR.length); i++) {
    const diff = Math.abs(lr[i] - expectedLR[i])
    if (diff > 0.000001) {
      console.log(`Index ${i}: Expected ${expectedLR[i].toFixed(6)}, Got ${lr[i].toFixed(6)}, Diff: ${diff.toFixed(6)}`)
    }
  }
}

console.log('\nTest completed!')
