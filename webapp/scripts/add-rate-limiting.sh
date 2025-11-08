#!/bin/bash

# Script to add rate limiting to all standard API endpoints
# This script adds the rate limiting import and check to routes that don't have AI/auth/upload rate limits

# List of standard endpoint routes (relative to webapp directory)
routes=(
  "app/api/metrics/route.ts"
  "app/api/metrics/details/route.ts"
  "app/api/metrics/ai-costs/route.ts"
  "app/api/employees/route.ts"
  "app/api/employees/[id]/route.ts"
  "app/api/data/list/route.ts"
  "app/api/data/import/route.ts"
  "app/api/data/delete/route.ts"
  "app/api/analytics/headcount/route.ts"
  "app/api/analytics/attrition/route.ts"
  "app/api/analytics/nine-box/route.ts"
  "app/api/analytics/metrics/route.ts"
  "app/api/analytics/errors/route.ts"
  "app/api/health/route.ts"
)

for route in "${routes[@]}"; do
  echo "Processing: $route"

  # Check if file exists
  if [ ! -f "$route" ]; then
    echo "  ⚠️  File not found: $route"
    continue
  fi

  # Check if rate limiting is already added
  if grep -q "applyRateLimit" "$route"; then
    echo "  ✓ Rate limiting already present"
    continue
  fi

  # Add import statement if not present
  if ! grep -q "import.*rate-limiter" "$route"; then
    # Find the last import line and add after it
    sed -i '' "/^import.*from/a\\
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
" "$route"
    echo "  + Added rate limiting import"
  fi

  echo "  ℹ️  Manual check required for rate limit application"
done

echo ""
echo "✅ Import statements added. Please manually add rate limit checks to each handler function."
echo "   Add this after the function declaration:"
echo "   // Apply rate limiting (standard endpoints: 100 req/min)"
echo "   const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard);"
echo "   if (!rateLimitResult.success) {"
echo "     return rateLimitResult.response;"
echo "   }"
