import { expect, test } from '@playwright/test';

const FOCUS_TARGETS = [
    { name: 'home nav link', selector: '.site-nav__link[href="/"]' },
    { name: 'events nav link', selector: '.site-nav__link[href="/events"]' },
    { name: 'language toggle', selector: '[data-lang-toggle]' },
] as const;

const MAX_TAB_PRESSES = 12;
const PUBLIC_PATHS = ['/', '/events', '/events/2026-06-15', '/nonexistent-404'] as const;
const SCRIPT_TIMEOUT = 20_000;
const TITLE_PATTERN = /^.+ \u2014 InterSub$/;

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('document structure', () => {
    for (const path of PUBLIC_PATHS) {
        test(`${path} exposes sound landmarks, headings, and labels`, async ({ page }) => {
            await page.goto(path);

            const structure = await page.evaluate(() => ({
                footerParent: document.querySelector('footer')?.parentElement?.tagName,
                h1Count: document.querySelectorAll('h1').length,
                headerParent: document.querySelector('header')?.parentElement?.tagName,
                headingLevels: [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(heading => Number(heading.tagName.slice(1))),
                mainCount: document.querySelectorAll('main, [role="main"]').length,
                missingAltCount: [...document.querySelectorAll('img')].filter(image => !image.hasAttribute('alt')).length,
                nestedLandmarkCount: document.querySelectorAll('main footer, main header').length,
                unresolvedLabelIds: [...document.querySelectorAll('[aria-labelledby]')]
                    .flatMap(element => (element.getAttribute('aria-labelledby') || '').split(/\s+/))
                    .filter(id => id && !document.getElementById(id)),
            }));

            const skippedLevels = structure.headingLevels.filter((level, index) => level > (structure.headingLevels[index - 1] ?? 0) + 1);

            expect(structure.mainCount).toBe(1);
            expect(structure.headerParent).toBe('BODY');
            expect(structure.footerParent).toBe('BODY');
            expect(structure.nestedLandmarkCount).toBe(0);
            expect(structure.h1Count).toBe(1);
            expect(skippedLevels).toEqual([]);
            expect(structure.missingAltCount).toBe(0);
            expect(structure.unresolvedLabelIds).toEqual([]);
        });
    }
});

test.describe('keyboard navigation', () => {
    test('tab from body reaches nav links and language toggle with visible focus styles', async ({ page }) => {
        await page.goto('/');

        const baseline: Record<string, string> = {};
        const remaining = new Map(FOCUS_TARGETS.map(target => [target.selector, target.name]));

        for (const target of FOCUS_TARGETS) {
            baseline[target.selector] = await page.locator(target.selector).evaluate(element => getComputedStyle(element).boxShadow);
        }

        for (let press = 0; press < MAX_TAB_PRESSES && remaining.size > 0; press += 1) {
            await page.keyboard.press('Tab');

            for (const selector of [...remaining.keys()]) {
                const isFocused = await page.locator(selector).evaluate(element => element === document.activeElement);

                if (!isFocused) continue;

                const focusedShadow = await page.locator(selector).evaluate(element => getComputedStyle(element).boxShadow);

                expect(focusedShadow, `focus indicator on ${remaining.get(selector)}`).not.toBe('none');
                expect(focusedShadow, `focus indicator on ${remaining.get(selector)}`).not.toBe(baseline[selector]);
                remaining.delete(selector);
            }
        }

        expect([...remaining.values()]).toEqual([]);
    });
});

test.describe('language', () => {
    test('html lang is en by default and zh after toggling', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('.site-nav__link[href="/"]')).toHaveAttribute('aria-current', 'page', { timeout: SCRIPT_TIMEOUT });
        await page.locator('[data-lang-toggle]').click();
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    });
});

test.describe('page titles', () => {
    test('titles are unique and follow the intersub suffix pattern', async ({ page }) => {
        const titles: string[] = [];

        for (const path of PUBLIC_PATHS) {
            await page.goto(path);
            titles.push(await page.title());
        }

        expect(new Set(titles).size).toBe(titles.length);
        expect(titles[0]).toBe('InterSub');

        for (const title of titles.slice(1)) expect(title).toMatch(TITLE_PATTERN);
    });
});
