import { expect, test } from '@playwright/test';

import type { Locator, Page } from '@playwright/test';

const HIDDEN_TRANSFORM = 'matrix(1, 0, 0, 1, 0, 26)';
const POLL = { timeout: 10_000 };
const SETTLED_TRANSFORM = 'matrix(1, 0, 0, 1, 0, 0)';

function areAllRevealed(page: Page, selector: string) {
    return page.locator(selector).evaluateAll(
        elements => elements.every(element => getComputedStyle(element).opacity === '1'),
    );
}

async function expectScrollContentShown(page: Page) {
    const areInlineShown = () => page.locator('[data-scroll]').evaluateAll(elements => elements.every(
        element => element instanceof HTMLElement && element.style.opacity === '1',
    ));

    const areRevealed = () => page.locator('[data-scroll], [data-scroll-stagger] > *').evaluateAll(
        elements => elements.every((element) => {
            const style = getComputedStyle(element);

            return style.opacity === '1' && style.transform === 'none';
        }),
    );

    expect(await page.locator('[data-scroll]').count()).toBeGreaterThan(1);

    await expect.poll(areInlineShown, POLL).toBe(true);
    await expect.poll(areRevealed, POLL).toBe(true);
}

function getOpacity(locator: Locator) {
    return locator.evaluate(element => getComputedStyle(element).opacity);
}

function getTransform(locator: Locator) {
    return locator.evaluate(element => getComputedStyle(element).transform);
}

function scrollToCenter(locator: Locator) {
    return locator.evaluate((element) => {
        element.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
}

test.describe('scroll motion', () => {
    test('reveals hero content on load without scrolling', async ({ page }) => {
        await page.goto('/');

        await expect.poll(() => getOpacity(page.locator('.hero__title')), POLL).toBe('1');
        await expect.poll(() => getOpacity(page.locator('.hero__subtitle')), POLL).toBe('1');
        await expect.poll(() => getTransform(page.locator('.hero__title')), POLL).toBe(SETTLED_TRANSFORM);
    });

    test('keeps below-fold sections hidden until scrolled into view', async ({ page }) => {
        await page.goto('/');

        const carousel = page.locator('.testimonials__carousel');
        const form = page.locator('.contact__form');

        await expect.poll(() => getTransform(carousel), POLL).toBe(HIDDEN_TRANSFORM);
        await expect.poll(() => getOpacity(page.locator('.hero__title')), POLL).toBe('1');

        expect(await getOpacity(carousel)).toBe('0');
        expect(await getOpacity(form)).toBe('0');

        await scrollToCenter(carousel);

        await expect.poll(() => getOpacity(carousel), POLL).toBe('1');

        expect(await getOpacity(form)).toBe('0');

        await scrollToCenter(form);

        await expect.poll(() => getOpacity(form), POLL).toBe('1');
    });

    test('shows stagger parents while their children animate in', async ({ page }) => {
        await page.goto('/');

        const cards = page.locator('.solutions__card');
        const list = page.locator('.solutions__list');

        await expect.poll(() => getOpacity(list), POLL).toBe('1');

        expect(await cards.count()).toBeGreaterThan(1);

        await expect.poll(() => getTransform(cards.first()), POLL).toBe(HIDDEN_TRANSFORM);

        expect(await getOpacity(cards.first())).toBe('0');

        await scrollToCenter(list);

        await expect.poll(() => areAllRevealed(page, '.solutions__card'), POLL).toBe(true);

        expect(await getOpacity(list)).toBe('1');
    });

    test('leaves the footer visible without a scroll animation', async ({ page }) => {
        await page.goto('/');

        const footer = page.locator('.site-footer');

        await expect(footer).toHaveCount(1);
        await expect(page.locator('.site-footer[data-scroll], .site-footer [data-scroll]')).toHaveCount(0);
        await expect.poll(() => getOpacity(page.locator('.hero__title')), POLL).toBe('1');

        expect(await getOpacity(footer)).toBe('1');

        await scrollToCenter(footer);

        expect(await getOpacity(footer)).toBe('1');
    });

    test('scopes scroll animations to the events page', async ({ page }) => {
        await page.goto('/events');

        const cards = page.locator('.events__card');
        const grid = page.locator('.events__grid');

        await expect.poll(() => getOpacity(page.locator('.events__title')), POLL).toBe('1');
        await expect.poll(() => getOpacity(page.locator('.events__subtitle')), POLL).toBe('1');
        await expect.poll(() => getOpacity(grid), POLL).toBe('1');

        expect(await cards.count()).toBeGreaterThan(0);

        await expect.poll(() => getTransform(cards.first()), POLL).toBe(HIDDEN_TRANSFORM);
        await expect.poll(() => getOpacity(cards.first()), POLL).toBe('0');

        await scrollToCenter(grid);

        await expect.poll(() => areAllRevealed(page, '.events__card'), POLL).toBe(true);
    });

    test('re-initializes scroll animations after client router navigation', async ({ page }) => {
        await page.goto('/');

        await expect.poll(() => getOpacity(page.locator('.hero__title')), POLL).toBe('1');

        await page.locator('.site-nav__link[href="/events"]').click();
        await expect(page).toHaveURL('/events');

        const firstCard = page.locator('.events__card').first();

        await expect.poll(() => getOpacity(page.locator('.events__title')), POLL).toBe('1');
        await expect.poll(() => getTransform(firstCard), POLL).toBe(HIDDEN_TRANSFORM);

        expect(await getOpacity(firstCard)).toBe('0');

        await scrollToCenter(page.locator('.events__grid'));

        await expect.poll(() => getOpacity(firstCard), POLL).toBe('1');

        await page.locator('.site-nav__link[href="/"]').click();
        await expect(page).toHaveURL('/');

        await expect.poll(() => getOpacity(page.locator('.hero__title')), POLL).toBe('1');
        await expect.poll(() => getTransform(page.locator('.testimonials__carousel')), POLL).toBe(HIDDEN_TRANSFORM);

        expect(await getOpacity(page.locator('.testimonials__carousel'))).toBe('0');
    });
});

test.describe('scroll motion under reduced motion', () => {
    test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('shows every home page data-scroll element immediately', async ({ page }) => {
        await page.goto('/');

        await expectScrollContentShown(page);
    });

    test('shows every events page data-scroll element immediately', async ({ page }) => {
        await page.goto('/events');

        await expectScrollContentShown(page);
    });
});
