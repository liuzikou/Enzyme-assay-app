#!/bin/bash

# Local CI script - mimics GitHub Actions workflow
set -e

echo "🚀 Starting local CI checks..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status "FAIL" "Not in project root directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    print_status "PASS" "Dependencies installed successfully"
else
    print_status "FAIL" "Failed to install dependencies"
    exit 1
fi

# Step 2: Type checking
echo "🔍 Running TypeScript type check..."
if npm run type-check; then
    print_status "PASS" "TypeScript type check passed"
else
    print_status "FAIL" "TypeScript type check failed"
    exit 1
fi

# Step 3: Linting
echo "🧹 Running ESLint..."
if npm run lint; then
    print_status "PASS" "ESLint passed"
else
    print_status "FAIL" "ESLint failed"
    exit 1
fi

# Step 4: Tests
echo "🧪 Running tests..."
if npm test -- --run; then
    print_status "PASS" "Tests passed"
else
    print_status "FAIL" "Tests failed"
    exit 1
fi

# Step 5: Build
echo "🏗️  Building project..."
if npm run build; then
    print_status "PASS" "Build successful"
else
    print_status "FAIL" "Build failed"
    exit 1
fi

echo "=================================="
print_status "PASS" "All local CI checks passed! 🎉"
echo ""
echo "💡 Next steps:"
echo "   - Run 'npm run quick-check' for faster validation"
echo "   - Run 'npm run last-fail' to analyze recent failures"
echo "   - Push to trigger GitHub Actions" 