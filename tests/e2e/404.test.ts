import { expect, test } from '@playwright/test';

test.describe('404 page', () => {
    test('returns 404 and renders the error section for an unknown path', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist');

        expect(response?.status()).toBe(404);

        await expect(page.locator('.error-not-found__code')).toHaveText('404');
        await expect(page.locator('#error-not-found-title')).toHaveText('This page doesn\'t exist');
        await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible();
    });

    test('returns 404 for deep unknown paths', async ({ page }) => {
        const response = await page.goto('/events/nope/deep');

        expect(response?.status()).toBe(404);

        await expect(page.locator('.error-not-found__code')).toHaveText('404');
    });

    test('navigates home from the home link', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');
        await page.getByRole('link', { name: 'Go home' }).click();

        await expect(page).toHaveURL('/');
        await expect(page).toHaveTitle('InterSub');
    });
});

test.describe('500 page', () => {
    test('renders the server error section on direct visit', async ({ page }) => {
        const response = await page.goto('/500');

        expect(response?.status()).toBe(500);

        await expect(page.locator('.error-server__code')).toHaveText('500');
        await expect(page.locator('#error-server-title')).toHaveText('Something went wrong');
    });
});
