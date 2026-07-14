import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('navbar navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);
    });

    test('navigates between home and events through the nav links', async ({ page }) => {
        await page.locator('[data-nav-menu]').getByRole('link', { name: 'Events' }).click();

        await expect(page).toHaveURL('/events');
        await expect(page.locator('#events-title')).toHaveText('Events');
        await expect(page.locator('[data-nav-menu] a[href="/events"]')).toHaveAttribute('aria-current', 'page');

        await page.locator('[data-nav-menu]').getByRole('link', { name: 'Home' }).click();

        await expect(page).toHaveURL('/');
        await expect(page.locator('.hero__title')).toBeVisible();
        await expect(page.locator('[data-nav-menu] a[href="/"]')).toHaveAttribute('aria-current', 'page');
    });

    test('keeps the window alive across client-side route transitions', async ({ page }) => {
        await page.evaluate(() => {
            (window as Window & { spaMarker?: boolean }).spaMarker = true;
        });

        await page.locator('[data-nav-menu]').getByRole('link', { name: 'Events' }).click();

        await expect(page).toHaveURL('/events');

        const marker = await page.evaluate(() => (window as Window & { spaMarker?: boolean }).spaMarker);

        expect(marker).toBe(true);
    });

    test('shows the language toggle label for the inactive language', async ({ page }) => {
        const toggle = page.locator('[data-lang-toggle]');

        await expect(toggle).toHaveText('中文');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');

        await toggle.click();

        await expect(toggle).toHaveText('EN');
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');

        await toggle.click();

        await expect(toggle).toHaveText('中文');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test('persists the language across reload and client-side navigation', async ({ page }) => {
        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');

        const stored = await page.evaluate(() => window.localStorage.getItem('lang'));

        expect(stored).toBe('zh');

        await page.reload();

        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
        await expect(page.locator('[data-lang-toggle]')).toHaveText('EN');

        await page.locator('[data-nav-menu]').getByRole('link', { name: '\u6D3B\u52A8' }).click();

        await expect(page).toHaveURL('/events');
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
        await expect(page.locator('[data-lang-toggle]')).toHaveText('EN');
    });

    test('shows both wordmark variants in either language', async ({ page }) => {
        const header = page.locator('.site-header');

        await expect(header.locator('img[alt="InterSub"]')).toBeVisible();
        await expect(header.locator('img[alt="言际阁"]')).toBeVisible();

        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
        await expect(header.locator('img[alt="InterSub"]')).toBeVisible();
        await expect(header.locator('img[alt="言际阁"]')).toBeVisible();
    });
});

test.describe('navbar mobile menu', () => {
    test.use({ viewport: { height: 667, width: 375 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);
    });

    test('toggles the drawer and aria-expanded from the menu button', async ({ page }) => {
        const menu = page.locator('[data-nav-menu]');
        const toggle = page.locator('[data-nav-toggle]');

        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(menu).toBeHidden();

        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(menu).toBeVisible();

        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(menu).toBeHidden();
    });

    test('traps tab focus across the open menu, including the language toggle', async ({ page }) => {
        const brand = page.locator('.site-header__brand');
        const language = page.locator('[data-lang-toggle]');
        const links = page.locator('[data-nav-menu] a');
        const toggle = page.locator('[data-nav-toggle]');

        await toggle.click();

        await expect(links.first()).toBeVisible();
        await expect(toggle).toBeFocused();

        await page.keyboard.press('Tab');

        await expect(brand).toBeFocused();

        await page.keyboard.press('Tab');

        await expect(links.first()).toBeFocused();

        await page.keyboard.press('Tab');

        await expect(links.last()).toBeFocused();

        await page.keyboard.press('Tab');

        await expect(language).toBeFocused();

        await page.keyboard.press('Tab');

        await expect(toggle).toBeFocused();

        await page.keyboard.press('Shift+Tab');

        await expect(language).toBeFocused();

        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Shift+Tab');

        await expect(brand).toBeFocused();

        await page.keyboard.press('Shift+Tab');

        await expect(toggle).toBeFocused();
    });

    test('closes on escape and restores focus to the toggle', async ({ page }) => {
        const menu = page.locator('[data-nav-menu]');
        const toggle = page.locator('[data-nav-toggle]');

        await toggle.click();

        await expect(menu.locator('a').first()).toBeVisible();

        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        await expect(menu.locator('a').first()).toBeFocused();

        await page.keyboard.press('Escape');

        await expect(menu).toBeHidden();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toBeFocused();
    });

    test('closes the drawer when a nav link is followed', async ({ page }) => {
        await page.locator('[data-nav-toggle]').click();
        await page.locator('[data-nav-menu]').getByRole('link', { name: 'Events' }).click();

        await expect(page).toHaveURL('/events');
        await expect(page.locator('[data-nav-menu]')).toBeHidden();
        await expect(page.locator('[data-nav-toggle]')).toHaveAttribute('aria-expanded', 'false');
    });
});
