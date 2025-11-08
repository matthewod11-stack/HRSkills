#!/bin/bash

# Script to add error handling imports and update catch blocks
# in all API route files

ROUTES=(
  "app/api/data/import/route.ts"
  "app/api/data/list/route.ts"
  "app/api/analytics/headcount/route.ts"
  "app/api/analytics/attrition/route.ts"
  "app/api/analytics/nine-box/route.ts"
  "app/api/analytics/metrics/route.ts"
  "app/api/analytics/chat/route.ts"
  "app/api/analytics/errors/route.ts"
  "app/api/performance/route.ts"
  "app/api/performance/analyze/route.ts"
  "app/api/health/route.ts"
  "app/api/auth/demo-token/route.ts"
  "app/api/employees/[id]/route.ts"
  "app/api/data/preview/[id]/route.ts"
  "app/api/data/preview-upload/route.ts"
  "app/api/metrics/details/route.ts"
)

for route in "${ROUTES[@]}"; do
  file="/Users/mattod/Desktop/HRSkills/webapp/$route"

  if [ ! -f "$file" ]; then
    echo "Skipping missing file: $file"
    continue
  fi

  echo "Processing: $route"

  # Check if already has the import
  if grep -q "handleApiError" "$file"; then
    echo "  ✓ Already has handleApiError import"
  else
    # Find the last import line and add our import after it
    if grep -q "from '@/lib/auth/middleware'" "$file"; then
      sed -i '' "/from '@\/lib\/auth\/middleware'/a\\
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';
" "$file"
      echo "  ✓ Added handleApiError import"
    fi
  fi
done

echo ""
echo "Import additions complete!"
echo "Note: Catch blocks still need manual review for proper context"
