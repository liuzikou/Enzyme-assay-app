#!/bin/bash

# Quick check script - runs only critical checks
set -e

echo "⚡ Quick validation check..."
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Step 1: Type checking (fastest)
echo "🔍 TypeScript check..."
if npm run type-check; then
    print_status "PASS" "TypeScript check passed"
else
    print_status "FAIL" "TypeScript check failed"
    exit 1
fi

# Step 2: Linting (fast)
echo "🧹 ESLint check..."
if npm run lint; then
    print_status "PASS" "ESLint check passed"
else
    print_status "FAIL" "ESLint check failed"
    exit 1
fi

echo "============================"
print_status "PASS" "Quick check completed! 🎉"
echo ""
echo "💡 For full validation, run 'npm run ci-local'" 