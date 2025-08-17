#!/usr/bin/env node

// Complete S2251 calculation test
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

// S2251 calculation functions
function calcS2251(duplicate, bgCtrl) {
  if (duplicate.length === 0 || bgCtrl.length === 0) return 0
  
  // Step 1: Calculate mean of duplicate wells, or use single well data
  const mean = meanDuplicate(duplicate)
  if (mean.length === 0) return 0
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  const lr = diffArray(mean, 1)
  if (lr.length === 0) return 0
  
  // Step 3: Calculate net-LR by subtracting 0% control LR
  const bgLr = diffArray(bgCtrl, 1)
  const netLr = subtractArray(lr, bgLr)
  if (netLr.length === 0) return 0
  
  // Step 4: Find max net-LR and its position
  const maxNetLr = Math.max(...netLr)
  const maxNetLrIndex = netLr.indexOf(maxNetLr)
  
  if (!isFinite(maxNetLr) || maxNetLrIndex <= 0) return 0
  
  // Step 5: Calculate linear regression slope from start to max position
  const x = Array.from({ length: maxNetLrIndex + 1 }, (_, i) => i)
  const y = netLr.slice(0, maxNetLrIndex + 1)
  
  // Linear regression calculation
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  return isFinite(slope) ? slope : 0
}

function calcS2251WithDebug(duplicate, bgCtrl) {
  const debug = {
    mean: [],
    lr: [],
    bgLr: [],
    netLr: [],
    maxNetLr: 0,
    maxNetLrIndex: -1,
    regressionSlope: 0,
    regressionData: { x: [], y: [] }
  }

  if (duplicate.length === 0 || bgCtrl.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 1: Calculate mean of duplicates
  debug.mean = meanDuplicate(duplicate)
  if (debug.mean.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  debug.lr = diffArray(debug.mean, 1)
  if (debug.lr.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 3: Calculate net-LR by subtracting 0% control LR
  debug.bgLr = diffArray(bgCtrl, 1)
  debug.netLr = subtractArray(debug.lr, debug.bgLr)
  if (debug.netLr.length === 0) {
    return { result: 0, debug }
  }
  
  // Step 4: Find max net-LR and its position
  debug.maxNetLr = Math.max(...debug.netLr)
  debug.maxNetLrIndex = debug.netLr.indexOf(debug.maxNetLr)
  
  if (!isFinite(debug.maxNetLr) || debug.maxNetLrIndex <= 0) {
    return { result: 0, debug }
  }
  
  // Step 5: Calculate linear regression slope from start to max position
  const x = Array.from({ length: debug.maxNetLrIndex + 1 }, (_, i) => i)
  const y = debug.netLr.slice(0, debug.maxNetLrIndex + 1)
  
  debug.regressionData = { x, y }
  
  // Linear regression calculation
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  debug.regressionSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  return { 
    result: isFinite(debug.regressionSlope) ? debug.regressionSlope : 0, 
    debug 
  }
}

function formatS2251Result(value, sigDigits = 4) {
  if (!isFinite(value) || value === 0) return "0";
  
  // For very small or very large numbers, use scientific notation
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
    return value.toExponential(sigDigits - 1);
  }
  
  // For normal numbers, use fixed decimal places
  return value.toFixed(sigDigits);
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

console.log('Complete S2251 Calculation Test');
console.log('================================');

// Test 1: Single well calculation
console.log('\n1. Single Well Test:');
const result1 = calcS2251(testData.singleWell.duplicate, testData.singleWell.bgCtrl);
console.log('Result:', result1);
console.log('Formatted:', formatS2251Result(result1, 4));

const debug1 = calcS2251WithDebug(testData.singleWell.duplicate, testData.singleWell.bgCtrl);
console.log('Debug result:', debug1.result);
console.log('Debug info available:', !!debug1.debug.mean.length);

// Test 2: Duplicate wells calculation
console.log('\n2. Duplicate Wells Test:');
const result2 = calcS2251(testData.duplicateWells.duplicate, testData.duplicateWells.bgCtrl);
console.log('Result:', result2);
console.log('Formatted:', formatS2251Result(result2, 4));

const debug2 = calcS2251WithDebug(testData.duplicateWells.duplicate, testData.duplicateWells.bgCtrl);
console.log('Debug result:', debug2.result);
console.log('Debug info available:', !!debug2.debug.mean.length);

// Test 3: Very small value (should use scientific notation)
console.log('\n3. Very Small Value Test:');
const smallValue = 0.00012345;
console.log('Value:', smallValue);
console.log('Formatted:', formatS2251Result(smallValue, 4));

// Test 4: Very large value (should use scientific notation)
console.log('\n4. Very Large Value Test:');
const largeValue = 12345.6789;
console.log('Value:', largeValue);
console.log('Formatted:', formatS2251Result(largeValue, 4));

// Test 5: Normal value (should use fixed decimal)
console.log('\n5. Normal Value Test:');
const normalValue = 0.1234;
console.log('Value:', normalValue);
console.log('Formatted:', formatS2251Result(normalValue, 4));

console.log('\nTest completed successfully!');
