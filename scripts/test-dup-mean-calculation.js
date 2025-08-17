#!/usr/bin/env node

// Test dup-mean calculation
console.log('Testing dup-mean calculation...\n')

// Test data
const testData = {
  wellId: 'A1',
  wellData: [0.100, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
  duplicateData: [0.100, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183]
}

console.log('Test Data:')
console.log('主孔数据:', testData.wellData.map(v => v.toFixed(3)).join(', '))
console.log('重复孔数据:', testData.duplicateData.map(v => v.toFixed(3)).join(', '))
console.log('')

// Mock meanDuplicate function
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

// Test calculation
console.log('=== dup-mean Calculation ===')

console.log('\nStep 1: Calculate mean of duplicates')
const mean = meanDuplicate([testData.wellData, testData.duplicateData])
console.log('平均值 (dup-mean):', mean.map(v => v.toFixed(4)).join(', '))
console.log('')

console.log('=== Calculation Details ===')
for (let i = 0; i < testData.wellData.length; i++) {
  const main = testData.wellData[i]
  const dup = testData.duplicateData[i]
  const avg = (main + dup) / 2
  console.log(`dup-mean[${i}] = (${main.toFixed(3)} + ${dup.toFixed(3)}) / 2 = ${avg.toFixed(4)}`)
}

console.log('')

// Expected values
console.log('=== Expected vs Actual ===')
const expectedMean = [
  0.1000,  // (0.100 + 0.100) / 2
  0.1055,  // (0.105 + 0.106) / 2
  0.1125,  // (0.112 + 0.113) / 2
  0.1205,  // (0.120 + 0.121) / 2
  0.1290,  // (0.128 + 0.130) / 2
  0.1380,  // (0.137 + 0.139) / 2
  0.1475,  // (0.146 + 0.149) / 2
  0.1580,  // (0.156 + 0.160) / 2
  0.1690,  // (0.167 + 0.171) / 2
  0.1805   // (0.178 + 0.183) / 2
]

console.log('Expected dup-mean:', expectedMean.map(v => v.toFixed(4)).join(', '))
console.log('Actual dup-mean:  ', mean.map(v => v.toFixed(4)).join(', '))
console.log('')

// Check if they match
const isCorrect = mean.length === expectedMean.length && 
  mean.every((val, i) => Math.abs(val - expectedMean[i]) < 0.0001)

console.log('dup-mean calculation is correct:', isCorrect ? '✅ YES' : '❌ NO')

if (!isCorrect) {
  console.log('\nDifferences:')
  for (let i = 0; i < Math.min(mean.length, expectedMean.length); i++) {
    const diff = Math.abs(mean[i] - expectedMean[i])
    if (diff > 0.0001) {
      console.log(`Index ${i}: Expected ${expectedMean[i].toFixed(4)}, Got ${mean[i].toFixed(4)}, Diff: ${diff.toFixed(4)}`)
    }
  }
}

console.log('\nTest completed!')
