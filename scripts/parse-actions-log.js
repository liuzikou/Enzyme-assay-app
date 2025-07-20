#!/usr/bin/env node

/**
 * GitHub Actions Log Parser
 * Parses and summarizes GitHub Actions workflow logs
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function parseLogFile(logContent) {
  const lines = logContent.split('\n');
  const summary = {
    totalLines: lines.length,
    errors: [],
    warnings: [],
    steps: [],
    duration: null,
    status: 'unknown'
  };

  let currentStep = null;
  let inErrorBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract step information
    if (line.includes('##[group]')) {
      currentStep = line.replace('##[group]', '').trim();
      summary.steps.push({ name: currentStep, status: 'running', startLine: i });
    }
    
    if (line.includes('##[endgroup]')) {
      if (currentStep) {
        const stepIndex = summary.steps.findIndex(s => s.name === currentStep);
        if (stepIndex !== -1) {
          summary.steps[stepIndex].endLine = i;
          summary.steps[stepIndex].status = 'completed';
        }
      }
    }

    // Extract errors
    if (line.includes('error') || line.includes('Error') || line.includes('ERROR')) {
      summary.errors.push({
        line: i + 1,
        content: line.trim(),
        step: currentStep
      });
    }

    // Extract warnings
    if (line.includes('warning') || line.includes('Warning') || line.includes('WARNING')) {
      summary.warnings.push({
        line: i + 1,
        content: line.trim(),
        step: currentStep
      });
    }

    // Extract duration
    if (line.includes('Total duration')) {
      const match = line.match(/Total duration[:\s]+([0-9.]+s)/);
      if (match) {
        summary.duration = match[1];
      }
    }

    // Extract final status
    if (line.includes('Status') && line.includes('Failure')) {
      summary.status = 'failed';
    } else if (line.includes('Status') && line.includes('Success')) {
      summary.status = 'success';
    }
  }

  return summary;
}

function printSummary(summary) {
  console.log(colorize('📊 GitHub Actions Log Summary', 'bold'));
  console.log('='.repeat(50));
  
  console.log(colorize(`Status: ${summary.status.toUpperCase()}`, summary.status === 'success' ? 'green' : 'red'));
  console.log(colorize(`Duration: ${summary.duration || 'unknown'}`, 'blue'));
  console.log(colorize(`Total Lines: ${summary.totalLines}`, 'cyan'));
  
  console.log('\n' + colorize('📋 Steps:', 'bold'));
  summary.steps.forEach(step => {
    const statusIcon = step.status === 'completed' ? '✅' : '⏳';
    console.log(`  ${statusIcon} ${step.name}`);
  });

  if (summary.errors.length > 0) {
    console.log('\n' + colorize('❌ Errors:', 'bold'));
    summary.errors.slice(0, 10).forEach(error => {
      console.log(colorize(`  Line ${error.line}: ${error.content}`, 'red'));
    });
    if (summary.errors.length > 10) {
      console.log(colorize(`  ... and ${summary.errors.length - 10} more errors`, 'yellow'));
    }
  }

  if (summary.warnings.length > 0) {
    console.log('\n' + colorize('⚠️  Warnings:', 'bold'));
    summary.warnings.slice(0, 5).forEach(warning => {
      console.log(colorize(`  Line ${warning.line}: ${warning.content}`, 'yellow'));
    });
    if (summary.warnings.length > 5) {
      console.log(colorize(`  ... and ${summary.warnings.length - 5} more warnings`, 'yellow'));
    }
  }

  console.log('\n' + colorize('💡 Recommendations:', 'bold'));
  if (summary.errors.length > 0) {
    console.log('1. Fix the errors listed above');
    console.log('2. Run local validation: npm run quick-check');
    console.log('3. Test locally: npm run ci-local');
  } else {
    console.log('✅ No errors found in the log');
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(colorize('Usage: node parse-actions-log.js <log-file>', 'yellow'));
    console.log('Example: node parse-actions-log.js actions-log.txt');
    process.exit(1);
  }

  const logFile = args[0];
  
  if (!fs.existsSync(logFile)) {
    console.error(colorize(`Error: Log file '${logFile}' not found`, 'red'));
    process.exit(1);
  }

  try {
    const logContent = fs.readFileSync(logFile, 'utf8');
    const summary = parseLogFile(logContent);
    printSummary(summary);
  } catch (error) {
    console.error(colorize(`Error reading log file: ${error.message}`, 'red'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseLogFile, printSummary }; 