import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

import type { Page } from '@playwright/test';

const SCRIPT_TIMEOUT = 20_000;
const VIEWPORT_HEIGHT = 800;
const WIDTHS = [320, 375, 767, 768, 769, 1_023, 1_024, 1_025, 1_280, 1_440] as const;
const ZH_PATHS = ['/', '/events'] as const;

const eventSlugs = readdirSync(join(process.cwd(), 'src/content/events'))
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace(/\.json$/, ''))
    .sort();

const pages = [
    { name: 'home', path: '/' },
    { name: 'events catalog', path: '/events' },
    { name: 'event detail', path: `/events/${eventSlugs[eventSlugs.length - 1]}` },
    { name: 'admin dashboard', path: '/admin' },
    { name: 'not found', path: '/nonexistent-404' },
    { name: 'server error', path: '/500' },
] as const;

function countHiddenScrollElements(page: Page) {
    return page.evaluate(() => [...document.querySelectorAll('[data-scroll]')].filter((element) => {
        const style = getComputedStyle(element);

        return style.opacity === '0' || style.visibility === 'hidden';
    }).length);
}

function getViewportMetrics(page: Page) {
    return page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
    }));
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('responsive layout', () => {
    for (const entry of pages) {
        test(`${entry.name} page fits every width with scroll content visible`, async ({ page }) => {
            await page.setViewportSize({ height: VIEWPORT_HEIGHT, width: WIDTHS[0] });
            await page.goto(entry.path);
            await page.locator('main').waitFor();

            for (const width of WIDTHS) {
                await page.setViewportSize({ height: VIEWPORT_HEIGHT, width });

                const metrics = await getViewportMetrics(page);

                expect(metrics.scrollWidth, `horizontal overflow at width ${width}`).toBeLessThanOrEqual(metrics.clientWidth);

                await expect
                    .poll(() => countHiddenScrollElements(page), {
                        message: `hidden [data-scroll] content at width ${width}`,
                        timeout: SCRIPT_TIMEOUT,
                    })
                    .toBe(0);
            }
        });
    }

    test('chinese layouts fit every width', async ({ page }) => {
        await page.addInitScript(() => window.localStorage.setItem('lang', 'zh'));

        for (const path of ZH_PATHS) {
            await page.setViewportSize({ height: VIEWPORT_HEIGHT, width: WIDTHS[0] });
            await page.goto(path);
            await expect(page.locator('html')).toHaveAttribute('lang', 'zh', { timeout: SCRIPT_TIMEOUT });

            for (const width of WIDTHS) {
                await page.setViewportSize({ height: VIEWPORT_HEIGHT, width });

                const metrics = await getViewportMetrics(page);

                expect(metrics.scrollWidth, `horizontal overflow on ${path} at width ${width}`).toBeLessThanOrEqual(metrics.clientWidth);
            }
        }
    });
});
