/**
 * E2E Tests for Critical User Flows
 *
 * Tests the complete user journeys through the HR Command Center application.
 */

import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/HR Command Center/);

    // Check header is visible
    await expect(page.getByRole('heading', { name: 'HR Command Center' })).toBeVisible();

    // Check skip-to-content link (should be focusable)
    const skipLink = page.getByRole('link', { name: /Skip to main content/i });
    await expect(skipLink).toBeAttached();
  });

  test('should display all key metrics', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for metric cards
    const metricsSection = page.locator('[aria-label="Key metrics"]');
    await expect(metricsSection).toBeVisible();

    // Metrics should be present (even if showing loading or empty states)
    const cards = page
      .locator('.group.relative')
      .filter({ hasText: /Attrition|Headcount|Engagement/ });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should display quick actions', async ({ page }) => {
    await page.goto('/');

    // Check for quick actions section
    const quickActions = page.locator('[aria-label="Quick actions"]');
    await expect(quickActions).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Press Tab to focus skip link
    await page.keyboard.press('Tab');

    // Skip link should be focused
    const skipLink = page.getByRole('link', { name: /Skip to main content/i });
    await expect(skipLink).toBeFocused();

    // Press Enter to skip to content
    await page.keyboard.press('Enter');

    // Main content should be focused (or at least visible)
    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/');

    // Click analytics card or link
    await page.click('text=/Analytics Dashboard/i');

    // Wait for navigation
    await page.waitForURL('/analytics');

    // Check we're on analytics page
    await expect(page).toHaveURL('/analytics');
  });

  test('should navigate to nine-box page', async ({ page }) => {
    await page.goto('/');

    // Navigate to nine-box
    await page.click('text=/Nine-Box Grid/i');

    // Wait for navigation
    await page.waitForURL('/nine-box');

    // Check we're on nine-box page
    await expect(page).toHaveURL('/nine-box');
  });

  test('should navigate to employees page', async ({ page }) => {
    await page.goto('/');

    // Navigate to employees
    await page.click('text=/Employee Directory/i');

    // Wait for navigation
    await page.waitForURL('/employees');

    // Check we're on employees page
    await expect(page).toHaveURL('/employees');
  });

  test('should navigate back to homepage', async ({ page }) => {
    await page.goto('/analytics');

    // Navigate back home
    await page.click('text=/Home|HR Command Center/i');

    // Wait for navigation
    await page.waitForURL('/');

    // Check we're on homepage
    await expect(page).toHaveURL('/');
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/HR Command Center/i);
  });

  test('should have proper landmarks', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check for header (navigation area)
    const header = page.locator('header');
    expect(await header.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check that something is focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('should work with keyboard only', async ({ page }) => {
    await page.goto('/');

    // Tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Press Enter on focused element (should not crash)
    await page.keyboard.press('Enter');

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Page should load
    await expect(page).toHaveTitle(/HR Command Center/);

    // Content should be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    // Page should load
    await expect(page).toHaveTitle(/HR Command Center/);

    // Content should be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');

    // Page should load
    await expect(page).toHaveTitle(/HR Command Center/);

    // Content should be visible
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (e.g., 401 for auth)
    const unexpectedErrors = consoleErrors.filter(
      (err) => !err.includes('401') && !err.includes('Unauthorized')
    );

    expect(unexpectedErrors).toHaveLength(0);
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    // Should return 404 status
    expect(response?.status()).toBe(404);

    // Page should still render something (not crash)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle offline state', async ({ page, context }) => {
    await page.goto('/');

    // Go offline
    await context.setOffline(true);

    // Try to navigate
    await page.click('text=/Analytics/i').catch(() => {
      // Navigation may fail, that's okay
    });

    // Go back online
    await context.setOffline(false);

    // Should be able to navigate again
    await page.goto('/');
    await expect(page).toHaveTitle(/HR Command Center/);
  });
});
