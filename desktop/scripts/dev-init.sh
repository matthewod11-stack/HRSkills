#!/bin/bash
# Desktop App Development Initialization Script
# Run this at the start of each development session
# Usage: ./desktop/scripts/dev-init.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== HR Command Center Desktop - Session Init ===${NC}"
echo ""

# 1. Confirm we're in the right directory
EXPECTED_DIR="HRSkills"
CURRENT_DIR=$(basename "$PWD")

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo -e "${RED}ERROR: Expected to be in $EXPECTED_DIR directory${NC}"
    echo "Current directory: $PWD"
    echo "Please cd to the HRSkills project root"
    exit 1
fi

echo -e "${GREEN}✓ Working directory confirmed${NC}"

# 2. Check required files exist
echo ""
echo -e "${BLUE}Checking required files...${NC}"

REQUIRED_FILES=(
    "docs/desktop/ROADMAP.md"
    "docs/desktop/PROGRESS.md"
    "docs/desktop/SESSION_PROTOCOL.md"
    "desktop/features.json"
    "webapp/package.json"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗ MISSING: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${YELLOW}WARNING: $MISSING_FILES required files missing${NC}"
fi

# 3. Install dependencies if needed
echo ""
echo -e "${BLUE}Checking dependencies...${NC}"

if [ -d "webapp/node_modules" ]; then
    echo -e "${GREEN}✓${NC} webapp/node_modules exists"
else
    echo -e "${YELLOW}Installing webapp dependencies...${NC}"
    (cd webapp && npm install)
fi

if [ -f "desktop/package.json" ]; then
    if [ -d "desktop/node_modules" ]; then
        echo -e "${GREEN}✓${NC} desktop/node_modules exists"
    else
        echo -e "${YELLOW}Installing desktop dependencies...${NC}"
        (cd desktop && npm install)
    fi
else
    echo -e "${YELLOW}⚠${NC} desktop/package.json not yet created (Phase 1)"
fi

# 4. Run verification
echo ""
echo -e "${BLUE}Running verification...${NC}"

echo "Type checking webapp..."
if (cd webapp && npm run type-check > /dev/null 2>&1); then
    echo -e "${GREEN}✓${NC} Webapp type check passes"
else
    echo -e "${RED}✗${NC} Webapp type check FAILED"
    echo "  Run: cd webapp && npm run type-check"
fi

echo "Running webapp tests..."
if (cd webapp && npm test -- --passWithNoTests > /dev/null 2>&1); then
    echo -e "${GREEN}✓${NC} Webapp tests pass"
else
    echo -e "${RED}✗${NC} Webapp tests FAILED"
    echo "  Run: cd webapp && npm test"
fi

if [ -f "desktop/package.json" ]; then
    echo "Type checking desktop..."
    if (cd desktop && npm run type-check > /dev/null 2>&1); then
        echo -e "${GREEN}✓${NC} Desktop type check passes"
    else
        echo -e "${RED}✗${NC} Desktop type check FAILED"
        echo "  Run: cd desktop && npm run type-check"
    fi
fi

# 5. Show current progress
echo ""
echo -e "${BLUE}=== Current Progress ===${NC}"
echo ""

if [ -f "docs/desktop/PROGRESS.md" ]; then
    # Show the most recent session (first ## Session entry)
    echo -e "${YELLOW}Most Recent Session:${NC}"
    awk '/^## Session/{if(found)exit; found=1} found' docs/desktop/PROGRESS.md | head -30
fi

echo ""
echo -e "${BLUE}=== Feature Status ===${NC}"

if [ -f "desktop/features.json" ]; then
    # Count features by status using grep (portable)
    PASS=$(grep -c '"status": "pass"' desktop/features.json 2>/dev/null || echo "0")
    FAIL=$(grep -c '"status": "fail"' desktop/features.json 2>/dev/null || echo "0")
    IN_PROGRESS=$(grep -c '"status": "in-progress"' desktop/features.json 2>/dev/null || echo "0")
    NOT_STARTED=$(grep -c '"status": "not-started"' desktop/features.json 2>/dev/null || echo "0")

    echo -e "${GREEN}Pass:${NC} $PASS | ${RED}Fail:${NC} $FAIL | ${YELLOW}In Progress:${NC} $IN_PROGRESS | Not Started: $NOT_STARTED"
fi

# 6. Show next tasks from ROADMAP
echo ""
echo -e "${BLUE}=== Next Tasks (from ROADMAP.md) ===${NC}"
echo ""

if [ -f "docs/desktop/ROADMAP.md" ]; then
    # Find first unchecked item in each phase
    grep -n "\[ \]" docs/desktop/ROADMAP.md | head -5
fi

echo ""
echo -e "${GREEN}=== Session Init Complete ===${NC}"
echo ""
echo "Ready to work! Follow SESSION_PROTOCOL.md for session workflow."
echo "Update PROGRESS.md and features.json as you complete work."
