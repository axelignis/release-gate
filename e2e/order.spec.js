'use strict';

const { test, expect } = require('@playwright/test');

for (const timezoneId of ['America/Santiago', 'UTC']) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });

    test(`order shows the estimated delivery date in ${timezoneId}`, async ({ page }) => {
      await page.goto('/order');
      await expect(page.locator('#delivery-date')).toHaveText('October 15, 2026');
    });
  });
}
