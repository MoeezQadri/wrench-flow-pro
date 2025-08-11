import { test, expect } from '@playwright/test';

const SUPABASE_BASE = 'https://zugmebtirwpdkblijlvx.supabase.co';

function mockSignup(page, email: string) {
  return page.route(`${SUPABASE_BASE}/auth/v1/signup`, async (route) => {
    const now = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email,
          created_at: now,
          updated_at: now,
        },
        session: {
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
          user: {
            id: '11111111-1111-1111-1111-111111111111',
            email,
            created_at: now,
            updated_at: now,
          },
        },
      }),
    });
  });
}

function mockOrgRPC(page, payload: any) {
  return page.route(`${SUPABASE_BASE}/rest/v1/rpc/create_organization_and_assign_user`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

test.describe('Signup E2E - Organization rules', () => {
  test.beforeEach(async ({ page }) => {
    // Avoid other Supabase calls interfering; you can extend with more routes as needed
    await page.route(`${SUPABASE_BASE}/auth/v1/token*`, (r) => r.fulfill({ status: 200, body: '{}' }));
  });

  test('Existing organization shows error and stays on register', async ({ page }) => {
    await mockSignup(page, 'john@example.com');
    await mockOrgRPC(page, {
      success: false,
      error: 'organization_exists',
      message: 'Organization already exists. Please contact your administrator to be added to this organization.',
    });

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
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('New organization created successfully redirects to home', async ({ page }) => {
    await mockSignup(page, 'jane@example.com');
    await mockOrgRPC(page, {
      success: true,
      organization_id: '22222222-2222-2222-2222-222222222222',
      role: 'admin',
      message: 'Created new organization successfully',
    });

    await page.goto('/auth/register');
    await page.getByLabel('Full Name').fill('Jane Doe');
    await page.getByLabel('Organization Name').fill('Nova Motors');
    await page.getByLabel('Email Address').fill('jane@example.com');
    await page.getByLabel('Password').fill('P@ssw0rd123');
    await page.getByLabel('Confirm Password').fill('P@ssw0rd123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Expect navigation to home
    await expect(page).toHaveURL(/\/$/);
  });
});
