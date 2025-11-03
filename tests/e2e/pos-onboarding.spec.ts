import { test, expect } from '@playwright/test';

test.describe('POS onboarding', () => {
  test('shows launch button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /launch register/i })).toBeVisible();
  });
});
