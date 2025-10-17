#!/bin/bash
# Fix data references in performAnalysis methods
# Add 'const data = _data;' at the start of each function

set -e

echo "Fixing data references in performAnalysis methods..."

find /Users/kalpeshjaju/Development/brand-builder-16-oct/src -name "*-agent.ts" -type f | while IFS= read -r file; do
  # Check if file has performAnalysis with _data parameter
  if grep -q "private async performAnalysis(_data:" "$file"; then
    # Insert 'const data = _data;' after the opening brace of performAnalysis
    # This makes the parameter "used" and allows the function body to reference 'data'
    awk '
      /private async performAnalysis\(_data:/ {
        print
        getline
        print
        print "    const data = _data; // Alias for function body usage"
        next
      }
      { print }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    echo "Fixed: $file"
  fi
done

echo "Done!"
