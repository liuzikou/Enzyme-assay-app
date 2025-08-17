#!/usr/bin/env node

// Simple test script for S2251 calculation
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

function movingAvg(arr, window) {
  if (window <= 0 || arr.length === 0) return [];
  if (window === 1) return [...arr];
  if (window > arr.length) return [];
  
  const result = [];
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

function calcS2251(duplicate, bgCtrl, window) {
  if (duplicate.length === 0 || bgCtrl.length === 0) return 0;
  
  // Step 1: Calculate mean of duplicate wells, or use single well data
  const mean = meanDuplicate(duplicate);
  if (mean.length === 0) return 0;
  
  // Step 2: Calculate first-order difference to get Lysis Rate (LR)
  const lr = diffArray(mean, 1);
  if (lr.length === 0) return 0;
  
  // Step 3: Calculate net-LR by subtracting 0% control LR
  const bgLr = diffArray(bgCtrl, 1);
  const netLr = subtractArray(lr, bgLr);
  if (netLr.length === 0) return 0;
  
  // Step 4: Find max net-LR and its position
  const maxNetLr = Math.max(...netLr);
  const maxNetLrIndex = netLr.indexOf(maxNetLr);
  
  if (!isFinite(maxNetLr) || maxNetLrIndex <= 0) return 0;
  
  // Step 5: Calculate linear regression slope from start to max position
  const x = Array.from({ length: maxNetLrIndex + 1 }, (_, i) => i);
  const y = netLr.slice(0, maxNetLrIndex + 1);
  
  // Linear regression calculation
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  return isFinite(slope) ? slope : 0;
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

console.log('S2251 Calculation Test');
console.log('=====================');

console.log('\nInput Data:');
console.log('Duplicate 1:', testData.duplicate[0]);
console.log('Duplicate 2:', testData.duplicate[1]);
console.log('Background Control:', testData.bgCtrl);

// Calculate step by step
console.log('\nCalculation Steps:');

const mean = meanDuplicate(testData.duplicate);
console.log('1. Mean of duplicates:', mean);

const lr = diffArray(mean, 1);
console.log('2. Lysis Rate (LR):', lr);

const bgLr = diffArray(testData.bgCtrl, 1);
console.log('3. Background LR:', bgLr);

const netLr = subtractArray(lr, bgLr);
console.log('4. Net LR (LR - bgLR):', netLr);

const maxNetLr = Math.max(...netLr);
const maxNetLrIndex = netLr.indexOf(maxNetLr);

console.log('5. Key values:');
console.log('   Max Net LR:', maxNetLr);
console.log('   Max Net LR Index:', maxNetLrIndex);

// Linear regression calculation
const x = Array.from({ length: maxNetLrIndex + 1 }, (_, i) => i);
const y = netLr.slice(0, maxNetLrIndex + 1);

console.log('6. Linear regression data:');
console.log('   X (time points):', x);
console.log('   Y (net LR values):', y);

const n = x.length;
const sumX = x.reduce((a, b) => a + b, 0);
const sumY = y.reduce((a, b) => a + b, 0);
const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

console.log('7. Linear regression calculation:');
console.log('   n:', n);
console.log('   sumX:', sumX);
console.log('   sumY:', sumY);
console.log('   sumXY:', sumXY);
console.log('   sumX2:', sumX2);
console.log('   Slope:', slope);

const result = calcS2251(testData.duplicate, testData.bgCtrl, testData.window);
console.log('\nFinal Result (PGR):', result);
console.log('Final Result (scientific notation):', result.toExponential(6));

console.log('\nTest completed successfully!');
