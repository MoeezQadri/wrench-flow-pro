import { test, expect } from '@playwright/test';

const SUPABASE_BASE = 'https://zugmebtirwpdkblijlvx.supabase.co';

function mockSignIn(page, success: boolean) {
  return page.route(`${SUPABASE_BASE}/auth/v1/token*`, async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('grant_type') !== 'password') {
      return route.continue();
    }
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'refresh',
          user: { id: 'u1', email: 'user@example.com' },
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    }
  });
}

test.describe('Login E2E', () => {
  test('invalid credentials shows error', async ({ page }) => {
    await mockSignIn(page, false);

    await page.goto('/auth/login');
    await page.getByLabel('Email Address').fill('john@example.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('valid credentials redirect to dashboard', async ({ page }) => {
    await mockSignIn(page, true);

    await page.goto('/auth/login');
    await page.getByLabel('Email Address').fill('jane@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/$/);
  });
});
