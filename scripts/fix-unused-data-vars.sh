#!/bin/bash
# Add void statement for data variables that are still unused
# This marks them as intentionally unused in placeholder implementations

set -e

echo "Adding void statements for unused data variables..."

find /Users/kalpeshjaju/Development/brand-builder-16-oct/src -name "*-agent.ts" -type f | while IFS= read -r file; do
  # Check if file has the pattern and the data variable is unused
  if grep -q "const data = _data; // Alias for function body usage" "$file"; then
    # Add void data; after the alias line
    awk '
      /const data = _data; \/\/ Alias for function body usage/ {
        print
        print "    void data; // Mark as intentionally unused in placeholder"
        next
      }
      { print }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    echo "Fixed: $file"
  fi
done

echo "Done!"
