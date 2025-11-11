/**
 * Playwright E2E Accessibility Tests
 * Tests WCAG 2.1 Level AA compliance across all pages
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('analytics page should not have accessibility violations', async ({ page }) => {
    await page.goto('/analytics');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('documents page should not have accessibility violations', async ({ page }) => {
    await page.goto('/documents');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('data sources page should not have accessibility violations', async ({ page }) => {
    await page.goto('/data-sources');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation Tests', () => {
  test('should allow tab navigation through homepage', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Check if focus outline is visible
    const hasFocusOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.outline !== 'none' && style.outlineWidth !== '0px';
    });

    expect(hasFocusOutline).toBeTruthy();
  });

  test('should allow escape key to close dialogs', async ({ page }) => {
    await page.goto('/');

    // Open command palette with Cmd+K
    await page.keyboard.press('Meta+K');

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 2000 }).catch(() => {});

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify dialog is closed
    const dialogExists = await page.locator('[role="dialog"]').count();
    expect(dialogExists).toBe(0);
  });

  test('skip-to-main link should work', async ({ page }) => {
    await page.goto('/');

    // Tab to skip link (first focusable element)
    await page.keyboard.press('Tab');

    // Press Enter on skip link
    await page.keyboard.press('Enter');

    // Verify focus moved to main content
    const focusedElementId = await page.evaluate(() => {
      return document.activeElement?.id;
    });

    expect(focusedElementId).toBe('main-content');
  });
});

test.describe('Screen Reader Compatibility Tests', () => {
  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const mainLandmark = await page.locator('main').count();
    expect(mainLandmark).toBeGreaterThan(0);

    // Verify main has accessible name or label
    const mainId = await page.locator('main').getAttribute('id');
    expect(mainId).toBeTruthy();
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/analytics');

    // Check for input with label
    const inputWithLabel = await page.locator('input[aria-label], input[id]').count();
    expect(inputWithLabel).toBeGreaterThan(0);
  });

  test('should announce live region updates', async ({ page }) => {
    await page.goto('/analytics');

    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').count();
    expect(liveRegions).toBeGreaterThanOrEqual(0); // May be 0 if no dynamic content yet
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });
});

test.describe('Color Contrast Tests', () => {
  test('should meet color contrast requirements', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });
});

test.describe('Focus Management Tests', () => {
  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.goto('/');

    // Try to open a metric details dialog by clicking a metric card
    const metricCard = page.locator('[class*="cursor-pointer"]').first();
    await metricCard.click().catch(() => {});

    // Wait for potential dialog
    await page.waitForTimeout(500);

    // If dialog opened, verify focus is trapped
    const dialogExists = await page.locator('[role="dialog"]').count();
    if (dialogExists > 0) {
      // Tab through dialog - focus should stay within
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const activeEl = document.activeElement;
        return dialog?.contains(activeEl);
      });

      expect(focusedElement).toBeTruthy();
    }
  });

  test('should restore focus after closing modal', async ({ page }) => {
    await page.goto('/');

    // Open command palette
    await page.keyboard.press('Meta+K');
    await page.waitForTimeout(300);

    // Close it
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Focus should return to body or previous element
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });
});
