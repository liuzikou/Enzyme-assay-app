#!/usr/bin/env node

// Test script for debug panel functionality
import fs from 'fs';
import path from 'path';

// Mock the metrics functions for testing
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

function calcS2251WithDebug(duplicate, bgCtrl, window) {
  // Initialize debug object
  const debug = {
    mean: [],
    lr: [],
    bgLr: [],
    netLr: [],
    maxNetLr: 0,
    maxNetLrIndex: -1,
    regressionSlope: 0,
    regressionData: { x: [], y: [] }
  };

  if (duplicate.length === 0 || bgCtrl.length === 0) {
    return { result: 0, debug };
  }
  
  // Step 1: Calculate mean of duplicates
  debug.mean = meanDuplicate(duplicate);
  if (debug.mean.length === 0) {
    return { result: 0, debug };
  }
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  debug.lr = diffArray(debug.mean, 1);
  if (debug.lr.length === 0) {
    return { result: 0, debug };
  }
  
  // Step 3: Calculate net-LR by subtracting 0% control LR
  debug.bgLr = diffArray(bgCtrl, 1);
  debug.netLr = subtractArray(debug.lr, debug.bgLr);
  if (debug.netLr.length === 0) {
    return { result: 0, debug };
  }
  
  // Step 4: Find max net-LR and its position
  debug.maxNetLr = Math.max(...debug.netLr);
  debug.maxNetLrIndex = debug.netLr.indexOf(debug.maxNetLr);
  
  if (!isFinite(debug.maxNetLr) || debug.maxNetLrIndex <= 0) {
    return { result: 0, debug };
  }
  
  // Step 5: Calculate linear regression slope from start to max position
  const x = Array.from({ length: debug.maxNetLrIndex + 1 }, (_, i) => i);
  const y = debug.netLr.slice(0, debug.maxNetLrIndex + 1);
  
  debug.regressionData = { x, y };
  
  // Linear regression calculation
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  debug.regressionSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  return { 
    result: isFinite(debug.regressionSlope) ? debug.regressionSlope : 0, 
    debug 
  };
}

// Test data
const testData = {
  duplicate: [
    [0.1, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
    [0.1, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183]
  ],
  bgCtrl: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  window: 3
};

console.log('Debug Panel Test');
console.log('===============');

console.log('\nInput Data:');
console.log('Duplicate 1:', testData.duplicate[0]);
console.log('Duplicate 2:', testData.duplicate[1]);
console.log('Background Control:', testData.bgCtrl);

// Test the debug function
const { result, debug } = calcS2251WithDebug(testData.duplicate, testData.bgCtrl, testData.window);

console.log('\nDebug Information:');
console.log('1. Mean data:', debug.mean);
console.log('2. Lysis Rate (LR):', debug.lr);
console.log('3. Background LR:', debug.bgLr);
console.log('4. Net LR:', debug.netLr);
console.log('5. Max Net LR:', debug.maxNetLr);
console.log('6. Max Net LR Index:', debug.maxNetLrIndex);
console.log('7. Regression data X:', debug.regressionData.x);
console.log('8. Regression data Y:', debug.regressionData.y);
console.log('9. Regression slope:', debug.regressionSlope);

console.log('\nFinal Result (PGR):', result);
console.log('Final Result (scientific notation):', result.toExponential(6));

console.log('\nTest completed successfully!');
