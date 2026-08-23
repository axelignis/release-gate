'use strict';

const { test, expect } = require('@playwright/test');

test('login accepts valid agent credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('agent@example.test');
  await page.getByLabel('Password').fill('gate-ready');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('status')).toHaveText('Welcome, agent');
});

test('login rejects invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('agent@example.test');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('status')).toHaveText('Invalid credentials');
});

test('cart adds one item', async ({ page }) => {
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Add field notebook' }).click();
  await expect(page.locator('#cart')).toHaveAttribute('data-pending', '0');
  await expect(page.locator('#cart-badge')).toHaveText('1');
});

test('cart keeps the latest badge after concurrent additions', async ({ page }) => {
  await page.goto('/cart');
  await page.evaluate(() => {
    document.querySelector('#add-item').click();
    document.querySelector('#add-item').click();
  });
  await expect(page.locator('#cart')).toHaveAttribute('data-pending', '0');
  await expect(page.locator('#cart-badge')).toHaveText('2');
});
