import { expect, test } from '@playwright/test';

test.describe('404 page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/this-page-does-not-exist');
    });

    test('displays 404 heading', async ({ page }) => {
        await expect(page.locator('.error-not-found__code')).toContainText('404');
    });
});
