# Accessibility Testing Guide

## Overview

This document provides comprehensive guidance for testing accessibility compliance in the HR Command Center application. We follow **WCAG 2.1 Level AA** standards.

---

## Quick Start

### Run All Accessibility Tests

```bash
# Run all accessibility tests (Jest + Playwright)
npm run test:all

# Run only Jest accessibility tests
npm run test:a11y

# Run only Playwright E2E accessibility tests
npm run test:e2e:a11y

# Run Playwright tests with UI
npm run test:e2e:ui
```

---

## Automated Testing

### 1. Jest + jest-axe Tests

**Location:** `__tests__/accessibility/`

**What it tests:**

- Component-level WCAG violations
- ARIA attribute validation
- Form label presence
- Color contrast ratios
- Focus indicator visibility

**Run tests:**

```bash
npm run test:a11y
```

**Example test:**

```typescript
it('should have no axe violations', async () => {
  const { container } = render(<ChatInterface />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 2. Playwright E2E Tests

**Location:** `e2e/accessibility.spec.ts`

**What it tests:**

- Full page WCAG compliance
- Keyboard navigation flows
- Focus management in modals
- Live region announcements
- Screen reader compatibility
- Heading hierarchy

**Run tests:**

```bash
npm run test:e2e:a11y
```

**View results:**

```bash
npx playwright show-report
```

---

## Manual Testing Checklist

### Keyboard Navigation Testing

- [ ] **Tab Navigation**: Tab through all interactive elements
  - Verify focus indicators are visible
  - Ensure logical tab order (top to bottom, left to right)
  - No keyboard traps

- [ ] **Reverse Navigation**: Shift+Tab works correctly
  - Focus moves backward through elements
  - Returns to expected elements

- [ ] **Escape Key**: Closes modals/dialogs
  - Focus returns to trigger element

- [ ] **Enter/Space**: Activates buttons
  - Works on all button elements
  - Works on custom interactive elements

- [ ] **Arrow Keys**: Navigate lists/dropdowns (if applicable)

- [ ] **Skip-to-Main Link**:
  - Visible when focused (Tab once from page load)
  - Jumps to main content when activated

**How to test:**

1. Load page
2. Press Tab repeatedly
3. Verify blue focus ring appears on each interactive element
4. Verify focus never disappears or gets trapped

### Screen Reader Testing

**Recommended tools:**

- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS
- **Chrome**: ChromeVox extension

**Test checklist:**

- [ ] **Page Title**: Announced on page load
  - Should be "HR Command Center" or page-specific title

- [ ] **Landmarks**: Properly identified
  - Main content area announced as "main"
  - Navigation areas announced

- [ ] **Headings**: Logical hierarchy
  - One H1 per page
  - H1 → H2 → H3 (no skipped levels)
  - Headings describe sections

- [ ] **Form Labels**: All inputs have labels
  - Chat input announced as "Chat message input"
  - Search inputs have descriptive labels
  - File upload has instructions

- [ ] **Buttons**: Describe their action
  - "Send message" (not just "Send")
  - "Open settings" (not unlabeled icon)

- [ ] **Live Regions**: Updates announced
  - Loading states announced
  - Search results count announced
  - Dynamic content changes announced

- [ ] **Images**: Have alt text (when added)

**How to test with VoiceOver:**

1. Enable VoiceOver: Cmd+F5
2. Navigate with: Ctrl+Option+→ (next item)
3. Activate with: Ctrl+Option+Space
4. Stop reading: Ctrl key

### Color Contrast Testing

**Tools:**

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Browser DevTools (Chrome: Lighthouse, Firefox: Accessibility Inspector)

**Requirements:**

- Normal text (< 18pt): **4.5:1** minimum
- Large text (≥ 18pt or 14pt bold): **3:1** minimum

**How to test:**

1. Open Chrome DevTools
2. Run Lighthouse audit
3. Check "Accessibility" category
4. Review contrast failures

**Key areas to check:**

- Gray text (`text-muted-foreground`) - **Fixed to 5.2:1**
- Button text on colored backgrounds
- Link colors
- Disabled state text

### Focus Indicator Testing

**Requirement:** All interactive elements must have visible focus indicators when navigated via keyboard.

**How to test:**

1. Tab through the page
2. Verify blue outline appears on each element
3. Check outline is clearly visible against background
4. Minimum 3px outline on buttons, 2px on other elements

**Visual check:**

- Outline color: Blue (#3B82F6)
- Outline width: 2-3px
- Outline offset: 2-3px from element
- Box shadow: Optional blue glow

### Zoom & Text Resize Testing

**Requirements:**

- Page must work at 200% text size
- Page must work at 400% browser zoom
- No horizontal scrolling at standard viewport

**How to test:**

1. **Text Resize**: Browser settings → Increase text size to 200%
2. **Browser Zoom**: Cmd/Ctrl + (+) to 400%
3. Verify:
   - Content remains readable
   - No overlapping text
   - All functionality accessible
   - No critical content hidden

---

## CI/CD Integration

### GitHub Actions Workflow

**Location:** `.github/workflows/accessibility-tests.yml`

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**What it does:**

1. Runs Jest accessibility tests
2. Runs Playwright E2E accessibility tests
3. Uploads test results as artifacts
4. Comments on PR if tests fail

**Viewing results:**

1. Go to GitHub Actions tab
2. Click on workflow run
3. Download test artifacts
4. View HTML reports

---

## Common Issues & Fixes

### Issue: Form input has no label

**Fix:**

```tsx
<label htmlFor="input-id" className="sr-only">
  Descriptive label text
</label>
<input
  id="input-id"
  aria-label="Descriptive label"
  aria-describedby="help-text-id"
/>
```

### Issue: Button has no accessible name

**Fix:**

```tsx
<button aria-label="Close dialog">
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

### Issue: Decorative icon confuses screen readers

**Fix:**

```tsx
<Icon className="w-5 h-5" aria-hidden="true" />
```

### Issue: Color contrast too low

**Fix:**

```css
/* Before: 3.8:1 */
--muted-foreground: oklch(0.708 0 0);

/* After: 5.2:1 ✅ */
--muted-foreground: oklch(0.78 0 0);
```

### Issue: Modal focus not trapped

**Fix:** Use Radix UI Dialog component (already implemented)

### Issue: No focus indicator visible

**Fix:** Already implemented in `globals.css`:

```css
*:focus-visible {
  outline: 2px solid hsl(217 91% 60%);
  outline-offset: 2px;
}
```

---

## Accessibility Test Coverage

### Current Coverage

✅ **Week 1 - Critical (Level A)**

- Form labels (12 instances fixed)
- Skip-to-main link
- Language attribute
- Screen reader only utilities

✅ **Week 2 - High Priority (Level AA)**

- Color contrast (5.2:1 ratio)
- Global focus indicators
- Live region announcements
- Heading hierarchy
- Decorative icons (aria-hidden)

✅ **Week 3 - Testing & Validation**

- Automated axe testing (jest-axe)
- E2E accessibility tests (Playwright)
- CI/CD integration (GitHub Actions)
- Manual testing procedures

🔄 **Week 4 - Polish (Pending)**

- ARIA landmarks
- Accessibility statement page
- Keyboard shortcuts documentation

---

## Resources

### Official Specifications

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse (Chrome)](https://developers.google.com/web/tools/lighthouse)

### Screen Readers

- [NVDA (Windows - Free)](https://www.nvaccess.org/)
- [JAWS (Windows - Paid)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS - Built-in)](https://www.apple.com/accessibility/voiceover/)

---

## Contact & Support

For accessibility questions or to report issues:

- Create an issue in the repository
- Tag with `accessibility` label
- Include WCAG criterion reference if known

**Accessibility Lead:** [Your Name]
**Last Updated:** November 4, 2025
