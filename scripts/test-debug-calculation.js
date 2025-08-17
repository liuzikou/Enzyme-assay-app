#!/usr/bin/env node

// Test script to verify debug panel calculation
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
  console.log('calcS2251WithDebug called with:');
  console.log('- duplicate arrays:', duplicate.length);
  console.log('- bgCtrl length:', bgCtrl.length);
  console.log('- window:', window);
  
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
    console.log('Early return: empty data');
    return { result: 0, debug };
  }
  
  // Step 1: Calculate mean of duplicates
  debug.mean = meanDuplicate(duplicate);
  console.log('Step 1 - Mean data length:', debug.mean.length);
  if (debug.mean.length === 0) {
    console.log('Early return: no mean data');
    return { result: 0, debug };
  }
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  debug.lr = diffArray(debug.mean, 1);
  console.log('Step 2 - LR length:', debug.lr.length);
  if (debug.lr.length === 0) {
    console.log('Early return: no LR data');
    return { result: 0, debug };
  }
  
  // Step 3: Calculate net-LR by subtracting 0% control LR
  debug.bgLr = diffArray(bgCtrl, 1);
  debug.netLr = subtractArray(debug.lr, debug.bgLr);
  console.log('Step 3 - Net LR length:', debug.netLr.length);
  if (debug.netLr.length === 0) {
    console.log('Early return: no net LR data');
    return { result: 0, debug };
  }
  
  // Step 4: Find max net-LR and its position
  debug.maxNetLr = Math.max(...debug.netLr);
  debug.maxNetLrIndex = debug.netLr.indexOf(debug.maxNetLr);
  console.log('Step 4 - Max Net LR:', debug.maxNetLr, 'at index:', debug.maxNetLrIndex);
  
  if (!isFinite(debug.maxNetLr) || debug.maxNetLrIndex <= 0) {
    console.log('Early return: invalid max net LR');
    return { result: 0, debug };
  }
  
  // Step 5: Calculate linear regression slope from start to max position
  const x = Array.from({ length: debug.maxNetLrIndex + 1 }, (_, i) => i);
  const y = debug.netLr.slice(0, debug.maxNetLrIndex + 1);
  
  debug.regressionData = { x, y };
  console.log('Step 5 - Regression data points:', x.length);
  
  // Linear regression calculation
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  debug.regressionSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  console.log('Step 5 - Regression slope:', debug.regressionSlope);
  
  return { 
    result: isFinite(debug.regressionSlope) ? debug.regressionSlope : 0, 
    debug 
  };
}

// Test data - single well
const testDataSingle = {
  duplicate: [
    [0.1, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178]
  ],
  bgCtrl: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  window: 3
};

// Test data - duplicate wells
const testDataDuplicate = {
  duplicate: [
    [0.1, 0.105, 0.112, 0.120, 0.128, 0.137, 0.146, 0.156, 0.167, 0.178],
    [0.1, 0.106, 0.113, 0.121, 0.130, 0.139, 0.149, 0.160, 0.171, 0.183]
  ],
  bgCtrl: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  window: 3
};

console.log('Debug Calculation Test');
console.log('=====================');

console.log('\n1. Testing Single Well:');
const result1 = calcS2251WithDebug(testDataSingle.duplicate, testDataSingle.bgCtrl, testDataSingle.window);
console.log('Single well result:', result1.result);
console.log('Single well debug info available:', !!result1.debug.mean.length);

console.log('\n2. Testing Duplicate Wells:');
const result2 = calcS2251WithDebug(testDataDuplicate.duplicate, testDataDuplicate.bgCtrl, testDataDuplicate.window);
console.log('Duplicate wells result:', result2.result);
console.log('Duplicate wells debug info available:', !!result2.debug.mean.length);

console.log('\nTest completed!');
