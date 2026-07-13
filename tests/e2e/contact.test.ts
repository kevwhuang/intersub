import { expect, test } from '@playwright/test';

import type { Page, Route } from '@playwright/test';

const ERROR_GENERIC = 'Something went wrong. Please try again.';
const ERROR_RATE_LIMITED = 'Too many requests. Please try again later.';

const VALID_FORM = {
    email: 'tester@example.com',
    message: 'We would like a tailored recommendation for our team.',
    name: 'Playwright Tester',
    wechat: 'playwright-tester',
} as const;

async function fillForm(page: Page) {
    const form = page.locator('.contact__form');

    await form.locator('input[name="name"]').fill(VALID_FORM.name);
    await form.locator('input[name="wechat"]').fill(VALID_FORM.wechat);
    await form.locator('input[name="email"]').fill(VALID_FORM.email);
    await form.locator('textarea[name="message"]').fill(VALID_FORM.message);
}

async function routeContact(page: Page, respond: (route: Route) => Promise<void>) {
    const calls: string[] = [];

    await page.route('**/api/contact', async (route) => {
        calls.push(route.request().url());
        await respond(route);
    });

    return calls;
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('contact form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('shows required errors inline on empty submit', async ({ page }) => {
        const calls = await routeContact(page, route => route.abort());

        await page.locator('.contact__submit').click();

        await expect(page.locator('#error-name')).toBeVisible();
        await expect(page.locator('#error-wechat')).toBeVisible();
        await expect(page.locator('#error-email')).toBeHidden();
        await expect(page.locator('#error-message')).toBeVisible();

        await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-describedby', 'error-name');
        await expect(page.locator('input[name="wechat"]')).toHaveAttribute('aria-describedby', 'error-wechat');
        await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-describedby', 'error-email');
        await expect(page.locator('textarea[name="message"]')).toHaveAttribute('aria-describedby', 'error-message');

        expect(calls).toEqual([]);
    });

    test('shows the email error for an invalid email', async ({ page }) => {
        const calls = await routeContact(page, route => route.abort());

        await fillForm(page);
        await page.locator('input[name="email"]').fill('not-an-email');
        await page.locator('.contact__submit').click();

        await expect(page.locator('#error-email')).toBeVisible();
        await expect(page.locator('#error-name')).toBeHidden();
        await expect(page.locator('#error-wechat')).toBeHidden();
        await expect(page.locator('#error-message')).toBeHidden();

        expect(calls).toEqual([]);
    });

    test('enforces maxlength on every field', async ({ page }) => {
        const wechatInput = page.locator('input[name="wechat"]');

        await expect(page.locator('input[name="name"]')).toHaveAttribute('maxlength', '100');
        await expect(wechatInput).toHaveAttribute('maxlength', '50');
        await expect(page.locator('input[name="email"]')).toHaveAttribute('maxlength', '200');
        await expect(page.locator('textarea[name="message"]')).toHaveAttribute('maxlength', '2000');

        await wechatInput.pressSequentially('x'.repeat(60));

        await expect(wechatInput).toHaveValue('x'.repeat(50));
    });

    test('shows the success state and resets the form after sending', async ({ page }) => {
        const calls = await routeContact(page, route => route.fulfill({ json: { sent: true } }));

        await fillForm(page);
        await page.locator('.contact__submit').click();

        await expect(page.locator('.contact__success')).toBeVisible();
        await expect(page.locator('.contact__form')).toBeHidden();

        await page.locator('.contact__reset').click();

        await expect(page.locator('.contact__form')).toBeVisible();
        await expect(page.locator('.contact__success')).toBeHidden();
        await expect(page.locator('input[name="name"]')).toHaveValue('');
        await expect(page.locator('input[name="wechat"]')).toHaveValue('');
        await expect(page.locator('input[name="email"]')).toHaveValue('');
        await expect(page.locator('textarea[name="message"]')).toHaveValue('');

        expect(calls).toHaveLength(1);
    });

    test('shows the rate limit message on 429', async ({ page }) => {
        const calls = await routeContact(page, route => route.fulfill({
            json: { error: ERROR_RATE_LIMITED },
            status: 429,
        }));

        await fillForm(page);
        await page.locator('.contact__submit').click();

        await expect(page.locator('.contact__network-error')).toBeVisible();
        await expect(page.locator('.contact__network-error')).toHaveText(ERROR_RATE_LIMITED);
        await expect(page.locator('.contact__form')).toBeVisible();

        expect(calls).toHaveLength(1);
    });

    test('shows the generic message on 500', async ({ page }) => {
        const calls = await routeContact(page, route => route.fulfill({
            json: { error: 'Failed to send message' },
            status: 500,
        }));

        await fillForm(page);
        await page.locator('.contact__submit').click();

        await expect(page.locator('.contact__network-error')).toBeVisible();
        await expect(page.locator('.contact__network-error')).toHaveText(ERROR_GENERIC);
        await expect(page.locator('.contact__form')).toBeVisible();

        expect(calls).toHaveLength(1);
    });

    test('shows the generic message when the request fails', async ({ page }) => {
        const calls = await routeContact(page, route => route.abort());

        await fillForm(page);
        await page.locator('.contact__submit').click();

        await expect(page.locator('.contact__network-error')).toBeVisible();
        await expect(page.locator('.contact__network-error')).toHaveText(ERROR_GENERIC);
        await expect(page.locator('.contact__form')).toBeVisible();

        expect(calls).toHaveLength(1);
    });

    test('disables the submit button while the request is pending', async ({ page }) => {
        const calls = await routeContact(page, async (route) => {
            await new Promise(resolve => setTimeout(resolve, 750));
            await route.fulfill({ json: { sent: true } });
        });

        const submitButton = page.locator('.contact__submit');

        await fillForm(page);
        await submitButton.click();

        await expect(submitButton).toBeDisabled();
        await expect(page.locator('.contact__success')).toBeVisible();
        await expect(submitButton).toBeEnabled();

        expect(calls).toHaveLength(1);
    });
});
