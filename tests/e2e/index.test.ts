import { expect, test } from '@playwright/test';

const DESCRIPTION_MAX = 160;
const DESCRIPTION_MIN = 120;

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('index page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('loads with the intersub title', async ({ page }) => {
        await expect(page).toHaveTitle('InterSub');
    });

    test('renders every home section with visible content', async ({ page }) => {
        await expect(page.locator('.hero__title')).toBeVisible();
        await expect(page.locator('.hero__title')).toContainText('Authority');

        await expect(page.locator('.method__statement').first()).toBeVisible();
        await expect(page.locator('.method__statement').first()).toHaveText('Customized training based on real scenarios and skill gaps');

        await expect(page.locator('#solutions-title')).toBeVisible();
        await expect(page.locator('#solutions-title')).toHaveText('Solutions');

        await expect(page.locator('#outcomes-title')).toBeVisible();
        await expect(page.locator('#outcomes-title')).toHaveText('Outcomes');

        await expect(page.locator('.testimonials__eyebrow')).toBeVisible();
        await expect(page.locator('.testimonials__eyebrow')).toHaveText('From the people in the room');

        await expect(page.locator('#contact-title')).toBeVisible();
        await expect(page.locator('#contact-title')).toHaveText('Get in touch');
    });

    test('exposes a meta description of the expected length', async ({ page }) => {
        const description = await page.locator('meta[name="description"]').getAttribute('content');

        expect(description).not.toBeNull();
        expect(String(description).length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
        expect(String(description).length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    });

    test('embeds parseable json-ld website data', async ({ page }) => {
        const raw = await page.locator('script[type="application/ld+json"]').textContent();

        const data = JSON.parse(String(raw)) as { '@type': string; 'name': string; 'url': string };

        expect(data['@type']).toBe('WebSite');
        expect(data.name).toBe('InterSub');
        expect(data.url).toContain('intersubstudio.com');
    });

    test('fits the default viewport without horizontal overflow', async ({ page }) => {
        const metrics = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
        }));

        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    });

    test('loads without console errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });
});
