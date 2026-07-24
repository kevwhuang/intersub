import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

interface EventEntry {
    title: string;
}

const CONTENT_DIR = fileURLToPath(new URL('../../src/content', import.meta.url));
const CUSTOM_TITLE = 'Custom Session & Salon';
const SLUG = '2026-06-15';

const event = JSON.parse(readFileSync(join(CONTENT_DIR, 'events', `${SLUG}.json`), 'utf-8')) as EventEntry;

const registerHref = `/?event=${encodeURIComponent(event.title)}#contact`;
const uiTranslations = JSON.parse(readFileSync(join(CONTENT_DIR, 'translations', 'ui.json'), 'utf-8')) as Translations;

function buildPrefill(title: string) {
    return `Hi! I'd like to sign up for \u201C${title}\u201D.\n\n`;
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('event registration', () => {
    test('links the register and back actions on the event detail page', async ({ page }) => {
        await page.goto(`/events/${SLUG}`);
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);

        const actions = page.locator('.event-detail__actions');

        await expect(actions.getByRole('link', { name: 'Register' })).toHaveAttribute('href', registerHref);
        await expect(actions.getByRole('link', { name: 'Back to all' })).toHaveAttribute('href', '/events');
    });

    test('translates the register and back actions in chinese', async ({ page }) => {
        await page.goto(`/events/${SLUG}`);
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);

        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');

        const actions = page.locator('.event-detail__actions');

        await expect(actions.getByRole('link', { name: uiTranslations.Register })).toHaveAttribute('href', registerHref);
        await expect(actions.getByRole('link', { name: uiTranslations['Back to all'] })).toHaveAttribute('href', '/events');
    });

    test('prefills the contact message from the register action and strips the query', async ({ page }) => {
        await page.goto(`/events/${SLUG}`);
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);

        await page.locator('.event-detail__actions').getByRole('link', { name: 'Register' }).click();

        await expect(page.locator('textarea[name="message"]')).toHaveValue(buildPrefill(event.title));
        await expect(page).toHaveURL('/#contact');
        await expect(page.locator('input[name="name"]')).toHaveValue('');
        await expect(page.locator('input[name="wechat"]')).toHaveValue('');
        await expect(page.locator('input[name="email"]')).toHaveValue('');
    });

    test('prefills from a direct event query and strips it from the url', async ({ page }) => {
        await page.goto(`/?event=${encodeURIComponent(CUSTOM_TITLE)}#contact`);

        await expect(page.locator('textarea[name="message"]')).toHaveValue(buildPrefill(CUSTOM_TITLE));
        await expect(page).toHaveURL('/#contact');
    });

    test('sends the prefilled registration through the mocked contact endpoint', async ({ page }) => {
        const bodies: unknown[] = [];

        await page.route('**/api/contact', async (route) => {
            bodies.push(route.request().postDataJSON());
            await route.fulfill({ json: { sent: true } });
        });

        await page.goto(`/events/${SLUG}`);
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);

        await page.locator('.event-detail__actions').getByRole('link', { name: 'Register' }).click();
        await expect(page.locator('textarea[name="message"]')).toHaveValue(buildPrefill(event.title));

        await page.locator('input[name="name"]').fill('Playwright Tester');
        await page.locator('input[name="wechat"]').fill('playwright-tester');
        await page.locator('.contact__submit').click();

        await expect(page.locator('.contact__success')).toBeVisible();
        await expect(page.locator('.contact__form')).toBeHidden();

        expect(bodies).toEqual([{
            email: '',
            message: `Hi! I'd like to sign up for \u201C${event.title}\u201D.`,
            name: 'Playwright Tester',
            wechat: 'playwright-tester',
        }]);
    });

    test('leaves the contact message empty without an event query', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);

        await expect(page.locator('textarea[name="message"]')).toHaveValue('');
        await expect(page).toHaveURL('/');
    });
});
