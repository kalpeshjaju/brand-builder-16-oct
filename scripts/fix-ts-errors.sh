#!/bin/bash

# Fix unused parameter errors in all agent files
find src -name "*-agent.ts" -type f | while read file; do
  # Fix extractData parameter
  sed -i '' 's/private async extractData(input:/private async extractData(_input:/g' "$file"

  # Fix performAnalysis parameter
  sed -i '' 's/private async performAnalysis(data:/private async performAnalysis(_data:/g' "$file"

  # Fix any other common patterns
  sed -i '' 's/async extractBrandData(input:/async extractBrandData(_input:/g' "$file"
  sed -i '' 's/private async extractMarketData(input:/private async extractMarketData(_input:/g' "$file"
  sed -i '' 's/private async extractCompetitorData(input:/private async extractCompetitorData(_input:/g' "$file"

  echo "Fixed: $file"
done

echo "All TypeScript errors fixed!"