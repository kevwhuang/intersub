import { expect, test } from '@playwright/test';

test.describe('500 page', () => {
    test('renders the server error section on direct visit', async ({ page }) => {
        const response = await page.goto('/500');

        expect(response?.status()).toBe(500);

        await expect(page.locator('.error-server__code')).toHaveText('500');
        await expect(page.locator('#error-server-title')).toHaveText('Something went wrong');
    });
});
