#!/bin/bash

# Revert the _input changes since we actually use the input parameter
find src -name "*-agent.ts" -type f | while read file; do
  # Revert extract methods - we need the input parameter
  sed -i '' 's/private async extractData(_input:/private async extractData(input:/g' "$file"
  sed -i '' 's/private async performAnalysis(_data:/private async performAnalysis(data:/g' "$file"
  sed -i '' 's/async extractBrandData(_input:/async extractBrandData(input:/g' "$file"
  sed -i '' 's/private async extractMarketData(_input:/private async extractMarketData(input:/g' "$file"
  sed -i '' 's/private async extractCompetitorData(_input:/private async extractCompetitorData(input:/g' "$file"
done

echo "Reverted parameter changes - input is actually used in function bodies"