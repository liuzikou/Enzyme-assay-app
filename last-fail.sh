#!/bin/bash

# Last failure analysis script
set -e

echo "🔍 Analyzing recent failures..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory"
    exit 1
fi

# Get the last commit hash
LAST_COMMIT=$(git rev-parse HEAD)
print_header "Last commit: $LAST_COMMIT"

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "⚠️  You have uncommitted changes"
    git status --short
    echo ""
fi

# Check local validation first
print_header "🔍 Running local validation..."
if npm run quick-check > /tmp/local-check.log 2>&1; then
    print_success "✅ Local validation passed"
    echo ""
    print_header "📋 Recent local validation log:"
    cat /tmp/local-check.log
else
    print_error "❌ Local validation failed"
    echo ""
    print_header "📋 Local validation errors:"
    cat /tmp/local-check.log
    echo ""
    print_header "💡 Suggested fixes:"
    echo "1. Run 'npm run lint' to see detailed linting errors"
    echo "2. Run 'npm run type-check' to see TypeScript errors"
    echo "3. Run 'npm test' to see test failures"
fi

# Check if we can access GitHub API (optional)
if command -v gh &> /dev/null; then
    print_header "🔗 Checking GitHub Actions status..."
    if gh auth status &> /dev/null; then
        print_success "✅ GitHub CLI authenticated"
        echo "Run 'gh run list' to see recent workflow runs"
    else
        print_warning "⚠️  GitHub CLI not authenticated"
        echo "Install GitHub CLI and run 'gh auth login' for remote status"
    fi
else
    print_warning "⚠️  GitHub CLI not installed"
    echo "Install GitHub CLI for remote status checking"
fi

echo ""
print_header "📊 Summary:"
echo "• Local validation: $(if [ $? -eq 0 ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)"
echo "• Uncommitted changes: $(if [ -n "$(git status --porcelain)" ]; then echo "⚠️  YES"; else echo "✅ NO"; fi)"
echo ""
print_header "💡 Next steps:"
echo "1. Fix any local validation errors above"
echo "2. Commit your changes: git add . && git commit -m 'your message'"
echo "3. Push to trigger GitHub Actions: git push"
echo "4. Check GitHub Actions status in your browser" 