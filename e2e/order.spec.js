'use strict';

const { test, expect } = require('@playwright/test');

test('order shows the estimated delivery date', async ({ page }) => {
  await page.goto('/order');
  await expect(page.locator('#delivery-date')).toHaveText('October 14, 2026');
});
