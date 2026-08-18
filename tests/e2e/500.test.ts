import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('500 page', () => {
    test('renders the server error section on direct visit', async ({ page }) => {
        const response = await page.goto('/500');

        expect(response?.status()).toBe(500);

        await expect(page).toHaveTitle('Server Error \u2014 InterSub');
        await expect(page.locator('.error-server__code')).toHaveText('500');
        await expect(page.locator('#error-server-title')).toHaveText('Something went wrong');
    });

    test('marks the page noindex for robots', async ({ page }) => {
        await page.goto('/500');

        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    });

    test('navigates home from the home link', async ({ page }) => {
        await page.goto('/500');
        await page.getByRole('link', { name: 'Go home' }).click();

        await expect(page).toHaveURL('/');
        await expect(page).toHaveTitle('InterSub');
    });
});
