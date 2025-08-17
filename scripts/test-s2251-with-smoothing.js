#!/usr/bin/env node

// Test script to verify S2251 calculation with smoothing
import fs from 'fs';
import path from 'path';

// Mock the metrics functions
function meanDuplicate(duplicates) {
  if (duplicates.length === 0) return [];
  
  const result = [];
  const length = duplicates[0].length;
  
  for (let i = 0; i < length; i++) {
    const values = duplicates.map(dup => dup[i]).filter(isFinite);
    
    if (values.length === 0) {
      result.push(0);
      continue;
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    result.push(isFinite(mean) ? mean : 0);
  }
  
  return result;
}

function diffArray(arr, order = 1) {
  if (order === 0) return [...arr];
  if (arr.length <= order) return [];
  
  const diff = [];
  for (let i = order; i < arr.length; i++) {
    diff.push(arr[i] - arr[i - order]);
  }
  return diff;
}

function subtractArray(data, bgCtrl) {
  if (data.length === 0 || bgCtrl.length === 0) return [];
  
  const result = [];
  const minLength = Math.min(data.length, bgCtrl.length);
  
  for (let i = 0; i < minLength; i++) {
    const diff = data[i] - bgCtrl[i];
    result.push(isFinite(diff) ? diff : 0);
  }
  
  return result;
}

function movingAvg(arr, window) {
  if (window <= 0 || arr.length === 0) return [];
  if (window === 1) return [...arr];
  if (window > arr.length) return []; // Window larger than array
  
  const result = [];
  // Only calculate for positions where the full window is available
  for (let i = 0; i <= arr.length - window; i++) {
    const slice = arr.slice(i, i + window);
    
    if (slice.length === 0) {
      result.push(0);
      continue;
    }
    
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    result.push(isFinite(avg) ? avg : 0);
  }
  return result;
}

// S2251 calculation with smoothing
function calcS2251WithSmoothing(duplicate, bgCtrl, smoothingWindow = 3) {
  console.log('S2251 calculation with smoothing window:', smoothingWindow);
  
  if (duplicate.length === 0 || bgCtrl.length === 0) return 0;
  
  // Step 1: Calculate mean of duplicate wells, or use single well data
  const mean = meanDuplicate(duplicate);
  console.log('Step 1 - Mean data:', mean.slice(0, 5), '...');
  if (mean.length === 0) return 0;
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  const lr = diffArray(mean, 1);
  console.log('Step 2 - LR (before smoothing):', lr.slice(0, 5), '...');
  if (lr.length === 0) return 0;
  
  // Step 3: Apply smoothing window to LR (early termination to ensure consistent window size)
  const smoothedLr = movingAvg(lr, smoothingWindow);
  console.log('Step 3 - Smoothed LR:', smoothedLr.slice(0, 5), '...');
  console.log('Step 3 - LR length before smoothing:', lr.length);
  console.log('Step 3 - Smoothed LR length:', smoothedLr.length);
  if (smoothedLr.length === 0) return 0;
  
  // Step 4: Calculate net-LR by subtracting 0% control LR
  const bgLr = diffArray(bgCtrl, 1);
  const netLr = subtractArray(smoothedLr, bgLr);
  console.log('Step 4 - Net LR:', netLr.slice(0, 5), '...');
  if (netLr.length === 0) return 0;
  
  // Step 5: Find max net-LR and its position
  const maxNetLr = Math.max(...netLr);
  const maxNetLrIndex = netLr.indexOf(maxNetLr);
  console.log('Step 5 - Max Net LR:', maxNetLr, 'at index:', maxNetLrIndex);
  
  if (!isFinite(maxNetLr) || maxNetLrIndex <= 0) return 0;
  
  // Step 6: Calculate linear regression slope from start to max position
  const x = Array.from({ length: maxNetLrIndex + 1 }, (_, i) => i);
  const y = netLr.slice(0, maxNetLrIndex + 1);
  
  // Linear regression calculation
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  console.log('Step 6 - Regression slope:', slope);
  
  return isFinite(slope) ? slope : 0;
}

// Test data
const testData = {
  singleWell: {
    duplicate: [
      [0.1, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178]
    ],
    bgCtrl: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
  },
  duplicateWells: {
    duplicate: [
      [0.1, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
      [0.1, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183]
    ],
    bgCtrl: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
  }
};

console.log('S2251 Calculation with Smoothing Test');
console.log('=====================================');

// Test 1: Single well with different smoothing windows
console.log('\n1. Single Well Test:');
console.log('--- No smoothing (window=1) ---');
const result1a = calcS2251WithSmoothing(testData.singleWell.duplicate, testData.singleWell.bgCtrl, 1);
console.log('Result:', result1a);

console.log('\n--- Smoothing window=3 ---');
const result1b = calcS2251WithSmoothing(testData.singleWell.duplicate, testData.singleWell.bgCtrl, 3);
console.log('Result:', result1b);

console.log('\n--- Smoothing window=5 ---');
const result1c = calcS2251WithSmoothing(testData.singleWell.duplicate, testData.singleWell.bgCtrl, 5);
console.log('Result:', result1c);

// Test 2: Duplicate wells with different smoothing windows
console.log('\n2. Duplicate Wells Test:');
console.log('--- No smoothing (window=1) ---');
const result2a = calcS2251WithSmoothing(testData.duplicateWells.duplicate, testData.duplicateWells.bgCtrl, 1);
console.log('Result:', result2a);

console.log('\n--- Smoothing window=3 ---');
const result2b = calcS2251WithSmoothing(testData.duplicateWells.duplicate, testData.duplicateWells.bgCtrl, 3);
console.log('Result:', result2b);

console.log('\n--- Smoothing window=5 ---');
const result2c = calcS2251WithSmoothing(testData.duplicateWells.duplicate, testData.duplicateWells.bgCtrl, 5);
console.log('Result:', result2c);

// Test 3: Compare results
console.log('\n3. Comparison:');
console.log('Single Well:');
console.log('  No smoothing:', result1a);
console.log('  Window=3:', result1b);
console.log('  Window=5:', result1c);

console.log('\nDuplicate Wells:');
console.log('  No smoothing:', result2a);
console.log('  Window=3:', result2b);
console.log('  Window=5:', result2c);

console.log('\nTest completed successfully!');
