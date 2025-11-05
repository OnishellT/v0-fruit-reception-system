#!/bin/bash

# Test Runner Script for Fruit Reception System
# This script runs all tests in the appropriate order

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🧪 FRUIT RECEPTION SYSTEM - TEST SUITE 🧪             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dev server is running
check_server() {
    print_status "Checking if development server is running..."

    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Development server is running on http://localhost:3000"
        return 0
    else
        print_warning "Development server is not running"
        return 1
    fi
}

# Start dev server if not running
start_server() {
    print_status "Starting development server..."
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!

    print_status "Waiting for server to start..."
    sleep 5

    # Wait for server to be ready
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Server started successfully (PID: $SERVER_PID)"
            return 0
        fi
        sleep 2
    done

    print_error "Failed to start development server"
    return 1
}

# Run authentication tests
run_auth_tests() {
    print_status "Running authentication tests..."
    echo ""

    if [ -f "tests/automated/test-auth.js" ]; then
        node tests/automated/test-auth.js
        AUTH_RESULT=$?

        if [ $AUTH_RESULT -eq 0 ]; then
            print_success "Authentication tests passed"
        else
            print_error "Authentication tests failed"
            return 1
        fi
    else
        print_warning "test-auth.js not found, skipping"
    fi

    echo ""
    return 0
}

# Run comprehensive tests
run_comprehensive_tests() {
    print_status "Running comprehensive test suite..."
    echo ""

    if [ -f "tests/debug/test-complete.js" ]; then
        node tests/debug/test-complete.js
        COMPREHENSIVE_RESULT=$?

        if [ $COMPREHENSIVE_RESULT -eq 0 ]; then
            print_success "Comprehensive tests passed"
        else
            print_error "Comprehensive tests failed"
            return 1
        fi
    else
        print_warning "test-complete.js not found, skipping"
    fi

    echo ""
    return 0
}

# Display test results
display_results() {
    print_status "Test Summary:"
    echo "  Authentication: $([ $AUTH_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo "  Comprehensive: $([ $COMPREHENSIVE_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo ""
}

# Cleanup
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status "Stopping development server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    AUTH_RESULT=1
    COMPREHENSIVE_RESULT=1

    # Check if server is running
    if ! check_server; then
        start_server
    fi

    # Run all tests
    run_auth_tests
    run_comprehensive_tests

    # Display results
    display_results

    # Final status
    if [ $AUTH_RESULT -eq 0 ] && [ $COMPREHENSIVE_RESULT -eq 0 ]; then
        print_success "All tests passed! 🎉"
        exit 0
    else
        print_warning "Some tests failed. Check the output above for details."
        exit 1
    fi
}

# Run main function
main
