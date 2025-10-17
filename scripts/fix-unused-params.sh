#!/bin/bash
# Fix unused parameter warnings in agent files
# Only fixes the 'data' parameter in performAnalysis methods which is truly unused in placeholder implementations

set -e

echo "Fixing unused 'data' parameter in performAnalysis methods..."

# Find all agent files and fix them
find /Users/kalpeshjaju/Development/brand-builder-16-oct/src -name "*-agent.ts" -type f | while IFS= read -r file; do
  # Only process if file contains the pattern
  if grep -q "private async performAnalysis(data:" "$file"; then
    sed -i '' 's/private async performAnalysis(data:/private async performAnalysis(_data:/g' "$file"
    echo "Fixed: $file"
  fi
done

echo "Done! Fixed all agent files."
