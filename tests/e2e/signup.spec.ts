import { test, expect } from '@playwright/test';

test('Register page shows organization helper text', async ({ page }) => {
  await page.goto('/auth/register');
  await expect(
    page.getByText(
      `Enter your organization name. If it doesn't exist, you'll become the admin of a new organization. If it already exists, contact your admin to be added.`
    )
  ).toBeVisible();
});

// The following integration flows require a seeded backend; keeping as examples
test.describe.skip('Signup flows requiring backend', () => {
  test('Existing org shows server error', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel('Full Name').fill('John Smith');
    await page.getByLabel('Organization Name').fill('Acme Inc');
    await page.getByLabel('Email Address').fill('john@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(
      page.getByText('Organization already exists. Please contact your administrator to be added to this organization.')
    ).toBeVisible();
  });
});
