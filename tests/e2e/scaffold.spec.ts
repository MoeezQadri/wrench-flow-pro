import { test } from '@playwright/test';

// Many app pages require authenticated context and seeded data.
// These suites are scaffolded and will be enabled once a stable test tenant is available.

test.describe.skip('Users Management E2E', () => {
  test('admin can add a user and see it in the list', async ({ page }) => {
    // TODO: Implement with seeded org, auth session, and network mocks as needed
  });

  test('member cannot access user management', async ({ page }) => {
    // TODO
  });
});

test.describe.skip('Invoices E2E', () => {
  test('create/edit/pay/filter invoice flow', async ({ page }) => {
    // TODO
  });
});

test.describe.skip('Tasks/Parts/Customers/Vehicles/Reports E2E', () => {
  test('core flows function within tenant isolation', async ({ page }) => {
    // TODO
  });
});
