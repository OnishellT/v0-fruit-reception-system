#!/bin/bash

# MCP Extension Setup Script
# This script helps you load the Playwright MCP extension in Chrome

echo "🔧 Playwright MCP Extension Setup"
echo "=================================="
echo ""
echo "To load the MCP extension in Chrome:"
echo ""
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked' button"
echo "4. Select this directory: $(pwd)/playwright-mcp-extension"
echo "5. The extension should appear as 'Playwright MCP Bridge'"
echo ""
echo "Once loaded, you'll see the extension icon in your toolbar."
echo "Click it to access the MCP bridge interface."
echo ""
echo "The extension allows Playwright to control browser tabs for testing."
echo ""
echo "✅ Extension directory: $(pwd)/playwright-mcp-extension"
echo "✅ Manifest version: $(cat playwright-mcp-extension/manifest.json | grep '"version"' | cut -d'"' -f4)"
echo ""
echo "Ready to test with: npm run test"