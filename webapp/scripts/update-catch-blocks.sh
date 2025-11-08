#!/bin/bash

# Update catch blocks to use handleApiError

FILES=(
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/data/import/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/data/list/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/analytics/headcount/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/analytics/attrition/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/analytics/nine-box/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/analytics/chat/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/performance/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/performance/analyze/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/auth/demo-token/route.ts"
  "/Users/mattod/Desktop/HRSkills/webapp/app/api/metrics/details/route.ts"
)

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    continue
  fi
  
  filename=$(basename $(dirname "$file"))/$(basename "$file")
  echo "Updating catch blocks in: $filename"
  
  # Use perl for multiline replacements
  perl -i -0pe 's/} catch \(error: any\) \{\s+console\.error\([^\)]+\);\s+return NextResponse\.json\(\s+\{ error: [^}]+\},\s+\{ status: 500 \}\s+\);/} catch (error: any) {\n    return handleApiError(error, {\n      endpoint: '"'"'ENDPOINT_PLACEHOLDER'"'"',\n      method: '"'"'METHOD_PLACEHOLDER'"'"',\n      userId: authResult.user.userId\n    });/g' "$file"
  
done

echo "Catch block updates complete!"
echo "Note: ENDPOINT_PLACEHOLDER and METHOD_PLACEHOLDER need manual updates"
