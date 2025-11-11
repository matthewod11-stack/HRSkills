#!/bin/bash

# Script to remove hasPermission checks from API routes
# This script removes the permission check blocks and replaces with a simple comment

FILES=(
  "app/api/metrics/route.ts"
  "app/api/metrics/details/route.ts"
  "app/api/performance/route.ts"
  "app/api/performance/analyze/route.ts"
  "app/api/actions/route.ts"
  "app/api/documents/[id]/route.ts"
  "app/api/analytics/chat/route.ts"
  "app/api/surveys/analyze/route.ts"
  "app/api/ai/translate/route.ts"
  "app/api/ai/extract-entities/route.ts"
  "app/api/ai/analyze-sentiment/route.ts"
  "app/api/ai/config/route.ts"
  "app/api/data/list/route.ts"
  "app/api/data/upload/route.ts"
  "app/api/data/import/route.ts"
  "app/api/data/preview-upload/route.ts"
  "app/api/data/delete/[fileId]/route.ts"
)

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Warning: $file not found, skipping..."
    continue
  fi

  echo "Processing $file..."

  # Use perl for multi-line regex replacement
  perl -i.bak -0pe 's/  \/\/ Check permissions?\n  if \(!hasPermission\([^)]+\)\) \{\n    return NextResponse\.json\(\n      \{ [^}]+ \},\n      \{ status: 403 \}\n    \);\n  \}/  \/\/ Single-user model: authenticated = authorized/g' "$file"

  # Alternative patterns for slightly different formatting
  perl -i.bak -0pe 's/  if \(!hasPermission\([^)]+\)\) \{\n    return NextResponse\.json\(\n      \{ success: false, error: [^}]+ \},\n      \{ status: 403 \}\n    \);\n  \}/  \/\/ Single-user model: authenticated = authorized/g' "$file"

  rm -f "${file}.bak"
  echo "  ✓ Updated $file"
done

echo ""
echo "All files processed!"
