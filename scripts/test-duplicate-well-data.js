#!/usr/bin/env node

// Test duplicate well data retrieval
console.log('Testing duplicate well data retrieval...\n')

// Mock raw data
const mockRawData = [
  { wellId: 'A1', timePoints: [0.100, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178] },
  { wellId: 'A2', timePoints: [0.100, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183] },
  { wellId: 'A3', timePoints: [0.100, 0.104, 0.111, 0.119, 0.127, 0.136, 0.145, 0.155, 0.166, 0.177] },
  { wellId: 'A4', timePoints: [0.100, 0.107, 0.114, 0.122, 0.131, 0.140, 0.150, 0.161, 0.172, 0.184] },
  { wellId: 'G11', timePoints: [0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100] },
  { wellId: 'G12', timePoints: [0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100, 0.100] }
]

console.log('Mock Raw Data:')
mockRawData.forEach(well => {
  console.log(`${well.wellId}: ${well.timePoints.map(v => v.toFixed(3)).join(', ')}`)
})
console.log('')

// Mock utility functions
function getFirstColumnWithData(row, rawData) {
  for (let col = 1; col <= 12; col++) {
    const wellId = `${row}${col}`
    const well = rawData.find(w => w.wellId === wellId)
    if (well) {
      return col
    }
  }
  return null
}

function meanDuplicateFromAdjacentWells(wellId, rawData) {
  // Parse well ID to get row and column
  const match = wellId.match(/^([A-H])(\d+)$/)
  if (!match) return null
  
  const row = match[1]
  const col = parseInt(match[2])
  
  // Get the first column with data for this row
  const firstCol = getFirstColumnWithData(row, rawData)
  if (firstCol === null) return null
  
  // Calculate relative position from first column
  const relativePos = col - firstCol + 1
  
  // Only process primary wells (odd relative positions)
  if (relativePos % 2 === 0) return null
  
  // Find the adjacent well (next column)
  const adjacentCol = col + 1
  if (adjacentCol > 12) return null // No adjacent well exists
  
  const adjacentWellId = `${row}${adjacentCol}`
  
  // Find the adjacent well in raw data
  const adjacentWell = rawData.find(well => well.wellId === adjacentWellId)
  
  if (!adjacentWell) return null
  
  // Return the adjacent well's direct readings (not averaged)
  return [...adjacentWell.timePoints]
}

// Test cases
const testCases = [
  { wellId: 'A1', expectedDuplicate: 'A2' },
  { wellId: 'A3', expectedDuplicate: 'A4' },
  { wellId: 'A2', expectedDuplicate: null }, // A2 is even, should be duplicate well
  { wellId: 'A4', expectedDuplicate: null }, // A4 is even, should be duplicate well
  { wellId: 'G11', expectedDuplicate: 'G12' }
]

console.log('=== Test Cases ===')
testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.wellId}`)
  
  const duplicateData = meanDuplicateFromAdjacentWells(testCase.wellId, mockRawData)
  
  if (duplicateData) {
    console.log(`✅ Found duplicate data for ${testCase.wellId}`)
    console.log(`Expected duplicate well: ${testCase.expectedDuplicate}`)
    console.log(`Duplicate data: ${duplicateData.map(v => v.toFixed(3)).join(', ')}`)
    
    // Verify it matches the expected duplicate well
    if (testCase.expectedDuplicate) {
      const expectedWell = mockRawData.find(w => w.wellId === testCase.expectedDuplicate)
      if (expectedWell) {
        const isCorrect = duplicateData.length === expectedWell.timePoints.length &&
          duplicateData.every((val, i) => Math.abs(val - expectedWell.timePoints[i]) < 0.0001)
        console.log(`Data matches expected: ${isCorrect ? '✅ YES' : '❌ NO'}`)
      }
    }
  } else {
    console.log(`❌ No duplicate data found for ${testCase.wellId}`)
    console.log(`Expected: ${testCase.expectedDuplicate === null ? 'No duplicate (correct)' : testCase.expectedDuplicate}`)
  }
})

console.log('\n=== Summary ===')
console.log('The function now returns direct readings from adjacent wells, not averaged values.')
console.log('This is the correct behavior for duplicate well data in S2251 calculations.')

console.log('\nTest completed!')
