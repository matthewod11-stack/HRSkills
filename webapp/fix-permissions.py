#!/usr/bin/env python3
import re
import glob

files_to_fix = [
    "app/api/metrics/details/route.ts",
    "app/api/metrics/route.ts",
    "app/api/ai/analyze-sentiment/route.ts",
    "app/api/ai/config/route.ts",
    "app/api/ai/translate/route.ts",
    "app/api/ai/extract-entities/route.ts",
    "app/api/actions/route.ts",
    "app/api/surveys/analyze/route.ts",
    "app/api/performance/route.ts",
    "app/api/performance/analyze/route.ts",
    "app/api/data/delete/[fileId]/route.ts",
    "app/api/data/list/route.ts",
    "app/api/data/preview-upload/route.ts",
    "app/api/data/import/route.ts",
    "app/api/data/upload/route.ts",
    "app/api/analytics/chat/route.ts",
]

# Pattern to match permission check blocks
patterns = [
    # Single line check
    r'  if \(!hasPermission\(authResult\.user, [^)]+\)\) \{\n    return NextResponse\.json\(\n      \{ success: false, error: [^\}]+ \},\n      \{ status: 403 \}\n    \);\n  \}',
    # Multi-condition check
    r'  if \(!hasPermission\([^)]+\) && !hasPermission\([^)]+\)\) \{\n    return NextResponse\.json\(\n      \{ success: false, error: [^\}]+ \},\n      \{ status: 403 \}\n    \);\n  \}',
]

replacement = "  // Single-user model: authenticated = authorized"

for filepath in files_to_fix:
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        original = content

        # Replace all permission check patterns
        for pattern in patterns:
            content = re.sub(pattern, replacement, content)

        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✓ Updated {filepath}")
        else:
            print(f"  Skipped {filepath} (no changes)")

    except FileNotFoundError:
        print(f"✗ Not found: {filepath}")
    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")

print("\nDone!")
